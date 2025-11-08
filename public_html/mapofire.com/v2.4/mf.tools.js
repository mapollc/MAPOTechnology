class Tools {
    use() {
        document.querySelectorAll('.filter-controls .tool').forEach(i => {
            i.style.display = 'inline-flex';
        });
    }

    startMeasure() {
        console.log('start measuring');
    }
}