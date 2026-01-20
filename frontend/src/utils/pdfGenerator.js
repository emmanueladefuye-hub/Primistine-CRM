import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import defaultLetterhead from '../assets/letterhead.jpg';

/**
 * Centralized PDF generation utility with built-in letterhead support
 */
export const pdfGenerator = {
    /**
     * Generates a PDF from a DOM element with a custom letterhead
     * @param {string} elementId - The ID of the element to capture
     * @param {Object} options - Configuration options
     * @param {string} options.fileName - Output filename
     * @param {string} options.letterheadUrl - URL of the letterhead image (falls back to default)
     * @param {Object} options.businessProfile - Business profile data for overlay
     * @param {Function} options.onProgress - Callback for progress updates
     */
    /**
     * Helper to load an image and convert to Data URL
     */
    loadImage: (url) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.src = url;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/jpeg')); // Consistent format
            };
            img.onerror = reject;
        });
    },

    generate: async (elementId, options = {}) => {
        const {
            fileName = 'document.pdf',
            letterheadUrl = null,
            businessProfile = null,
            onProgress = () => { }
        } = options;

        try {
            const element = document.getElementById(elementId);
            if (!element) throw new Error("Target element not found");

            // Load letterhead first if needed
            let letterheadData = null;
            if (letterheadUrl || defaultLetterhead) {
                onProgress('Loading resources...');
                try {
                    const urlToLoad = letterheadUrl || defaultLetterhead;
                    letterheadData = await pdfGenerator.loadImage(urlToLoad);
                } catch (e) {
                    console.warn("Could not load letterhead:", e);
                }
            }

            onProgress('Capturing content...');

            // Capture the element to canvas
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');

            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            const margin = 10;
            const contentWidth = pageWidth - (margin * 2);
            const contentHeight = (canvas.height * contentWidth) / canvas.width;

            let yPosition = margin;

            // Add Letterhead
            if (letterheadData) {
                onProgress('Applying letterhead...');
                try {
                    const lhHeight = 48; // Standardized height
                    pdf.addImage(letterheadData, 'JPEG', 0, 0, pageWidth, lhHeight);

                    // Overlay business profile data beside the icons on the right
                    if (businessProfile) {
                        pdf.setFont('helvetica', 'bold');
                        pdf.setFontSize(10);
                        pdf.setTextColor(255, 255, 255);

                        const iconX = pageWidth - 20;

                        // Phone
                        if (businessProfile.phone) {
                            pdf.text(businessProfile.phone, iconX - 2, 11, { align: 'right' });
                        }

                        // Email
                        if (businessProfile.email) {
                            pdf.text(businessProfile.email, iconX - 2, 24, { align: 'right' });
                        }

                        // Address
                        if (businessProfile.address) {
                            const address = businessProfile.address.replace(/\n/g, ', ').trim();
                            pdf.setFontSize(9);
                            pdf.text(address, iconX - 2, 36, { align: 'right' });
                        }
                    }

                    yPosition += lhHeight + 3;
                } catch (e) {
                    console.warn("Failed to apply letterhead", e);
                }
            }

            onProgress('Building document...');

            // If content fits on one page (with letterhead)
            if (yPosition + contentHeight < pageHeight - margin) {
                pdf.addImage(imgData, 'PNG', margin, yPosition, contentWidth, contentHeight);
            } else {
                // Multi-page logic
                let heightLeft = contentHeight;

                // First page with letterhead
                pdf.addImage(imgData, 'PNG', margin, yPosition, contentWidth, contentHeight);
                heightLeft -= (pageHeight - yPosition - margin);

                while (heightLeft > 0) {
                    pdf.addPage();
                    const position = heightLeft - contentHeight;
                    pdf.addImage(imgData, 'PNG', margin, position + margin, contentWidth, contentHeight);
                    heightLeft -= (pageHeight - (margin * 2));
                }
            }

            onProgress('Saving...');
            pdf.save(fileName);
            return true;
        } catch (error) {
            console.error("PDF Generation Error:", error);
            throw error;
        }
    }
};

export default pdfGenerator;
