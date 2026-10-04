import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// Helper to sanitize element or cloned DOM before html2canvas processes it,
// converting any oklch() color expressions to rgb/rgba fallback that html2canvas supports.
function sanitizeClonedDocumentForCanvas(clonedDoc: Document): void {
  const tempCtx = document.createElement('canvas').getContext('2d');

  function resolveOklchToRgb(str: string): string {
    if (!str || !str.includes('oklch')) return str;
    // Replace all oklch(...) occurrences in the string
    return str.replace(/oklch\([^)]+\)/gi, (match) => {
      try {
        if (tempCtx) {
          tempCtx.fillStyle = '#000000';
          tempCtx.fillStyle = match;
          return tempCtx.fillStyle;
        }
      } catch {
        // ignore
      }
      return 'rgb(30, 41, 59)'; // safe slate fallback if parsing fails
    });
  }

  // 1. Clean all style tags and style sheets in the cloned document
  const styleTags = clonedDoc.querySelectorAll('style');
  styleTags.forEach((styleTag) => {
    if (styleTag.textContent && styleTag.textContent.includes('oklch')) {
      styleTag.textContent = resolveOklchToRgb(styleTag.textContent);
    }
  });

  // Also replace any oklch directly in clonedDoc.styleSheets
  try {
    for (let i = 0; i < clonedDoc.styleSheets.length; i++) {
      const sheet = clonedDoc.styleSheets[i];
      try {
        const rules = sheet.cssRules || sheet.rules;
        for (let j = 0; j < rules.length; j++) {
          const rule = rules[j] as CSSStyleRule;
          if (rule && rule.cssText && rule.cssText.includes('oklch')) {
            const cleanCss = resolveOklchToRgb(rule.cssText);
            try {
              sheet.deleteRule(j);
              sheet.insertRule(cleanCss, j);
            } catch {
              // Ignore cross-origin sheet errors
            }
          }
        }
      } catch {
        // Ignore cross-origin sheet errors
      }
    }
  } catch {
    // Ignore sheet access errors
  }

  // 2. Iterate through all elements and sanitize computed & inline styles
  const allElements = clonedDoc.querySelectorAll('*');
  const colorProps = [
    'color',
    'background-color',
    'border-top-color',
    'border-right-color',
    'border-bottom-color',
    'border-left-color',
    'outline-color',
    'text-decoration-color',
    'fill',
    'stroke',
  ];

  allElements.forEach((el) => {
    const htmlEl = el as HTMLElement;
    if (!htmlEl || !htmlEl.style) return;

    // Sanitize existing inline style attributes
    for (let i = 0; i < htmlEl.style.length; i++) {
      const prop = htmlEl.style[i];
      const val = htmlEl.style.getPropertyValue(prop);
      if (val && val.includes('oklch')) {
        htmlEl.style.setProperty(prop, resolveOklchToRgb(val), htmlEl.style.getPropertyPriority(prop));
      }
    }

    // Force computed color properties into inline rgb styles so html2canvas never reads oklch
    try {
      const win = clonedDoc.defaultView || window;
      const comp = win.getComputedStyle(htmlEl);
      for (const p of colorProps) {
        const cVal = comp.getPropertyValue(p);
        if (cVal && cVal.includes('oklch')) {
          htmlEl.style.setProperty(p, resolveOklchToRgb(cVal), 'important');
        }
      }
    } catch {
      // Continue
    }
  });
}

export async function exportInvoiceToPdf(elementId: string, filename: string): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error('Invoice element not found');
    return false;
  }

  try {
    // Add temporary styling for snapshot
    const originalShadow = element.style.boxShadow;
    element.style.boxShadow = 'none';

    const canvas = await html2canvas(element, {
      scale: 2.5, // High resolution for crisp print type
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      onclone: (clonedDoc) => {
        sanitizeClonedDocumentForCanvas(clonedDoc);
      },
    });

    element.style.boxShadow = originalShadow;

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pdfWidth = 210; // A4 width in mm
    const pdfHeight = 297; // A4 height in mm
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    if (imgHeight <= pdfHeight) {
      // Single page document
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight, undefined, 'FAST');
    } else {
      // Multi-page document handling
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;
      }
    }

    const safeFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    pdf.save(safeFilename);
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    return false;
  }
}

export async function exportInvoiceToPng(elementId: string, filename: string): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) return false;

  try {
    const originalShadow = element.style.boxShadow;
    element.style.boxShadow = 'none';

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      onclone: (clonedDoc) => {
        sanitizeClonedDocumentForCanvas(clonedDoc);
      },
    });

    element.style.boxShadow = originalShadow;

    const image = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = image;
    link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (error) {
    console.error('Error exporting PNG:', error);
    return false;
  }
}

export function triggerPrintInvoice(): void {
  window.print();
}
