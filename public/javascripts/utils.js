(function handleWeekSelection() {
    let allWeeks = [].slice.call(document.querySelectorAll('a.dropdown-item'));
    for (let week of allWeeks) {
        week.addEventListener('click', () => {
            allWeeks.forEach(otherWeek => {
                otherWeek.classList.remove('active');
            });
            week.classList.add('active');
        })
    }
}());

function getSelectedWeek() {
    return document.querySelector('a.dropdown-item.active').getAttribute('value');
}