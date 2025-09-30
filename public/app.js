document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const pdfFile = document.getElementById('pdf-file');
    const fileNameDisplay = document.getElementById('file-name');
    const contractText = document.getElementById('contract-text');
    const analyzeBtn = document.getElementById('analyze-btn');
    const spinner = document.getElementById('spinner');
    const resultsDiv = document.getElementById('results');
    const resultsContent = document.getElementById('results-content');

    // --- Drag and Drop Logic ---
    dropZone.addEventListener('click', () => pdfFile.click());
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });
    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            pdfFile.files = files;
            fileNameDisplay.textContent = files[0].name;
        }
    });
    pdfFile.addEventListener('change', () => {
        if (pdfFile.files.length > 0) {
            fileNameDisplay.textContent = pdfFile.files[0].name;
        }
    });

    // --- Analysis Logic ---
    analyzeBtn.addEventListener('click', async () => {
        let textToAnalyze = contractText.value.trim();
        const file = pdfFile.files[0];

        if (!textToAnalyze && file) {
            // If text area is empty, try to extract text from PDF
            try {
                textToAnalyze = await extractTextFromPdf(file);
            } catch (error) {
                resultsContent.innerHTML = `<p style=\"color: red;\">Error reading PDF: ${error.message}</p>`;
                resultsDiv.classList.remove('hidden');
                return;
            }
        }

        if (!textToAnalyze) {
            alert('Please paste contract text or upload a PDF.');
            return;
        }
        
        // Show spinner and hide old results
        spinner.classList.remove('hidden');
        resultsDiv.classList.add('hidden');
        analyzeBtn.disabled = true;

        try {
            // Send the text to the backend worker for analysis
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: textToAnalyze }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'The analysis failed.');
            }

            const data = await response.json();
            
            // Display the results
            resultsContent.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`; // Placeholder display
            resultsDiv.classList.remove('hidden');

        } catch (error) {
            resultsContent.innerHTML = `<p style=\"color: red;\">An error occurred: ${error.message}</p>`;
            resultsDiv.classList.remove('hidden');
        } finally {
            spinner.classList.add('hidden');
            analyzeBtn.disabled = false;
        }
    });

    // --- PDF Text Extraction ---
    async function extractTextFromPdf(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const pdf = await pdfjsLib.getDocument({ data: event.target.result }).promise;
                    let text = '';
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const content = await page.getTextContent();
                        content.items.forEach(item => {
                            text += item.str + ' ';
                        });
                    }
                    resolve(text);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = (error) => reject(error);
            reader.readAsArrayBuffer(file);
        });
    }
});