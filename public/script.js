document.getElementById('cvForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const data = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        experience: document.getElementById('experience').value,
        education: document.getElementById('education').value
    };

    const response = await fetch('/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'Moje_CV.pdf';
    a.click();

    window.URL.revokeObjectURL(url);
});
