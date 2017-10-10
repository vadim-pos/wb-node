import axios from 'axios';
import dompurify from 'dompurify';

const getSearchResultsItems = stores => stores.map(store => `
  <a href="/stores/${store.slug}" class="search__result">
    <strong>${store.name}</strong>
  </a>
`).join('');

const typeAhead = searchElement => {
  if (!searchElement) return;

  const searchInput = searchElement.querySelector('input[name="search"]');
  const searchResults = searchElement.querySelector('.search__results');

  searchInput.on('input', function() {
    if (!this.value) return searchResults.style.display = 'none';

    searchResults.style.display = 'block';

    axios.get(`/api/search?q=${this.value}`)
      .then(res => {
        if (res.data.length) return searchResults.innerHTML = dompurify.sanitaze(getSearchResultsItems(res.data));
        searchResults.innerHTML = `<div class="search__result">No results for ${dompurify.sanitaze(this.value)}</div>`
      })
      .catch(err => console.error(err));
  })

  // handle keyboard arrows pressing
  searchInput.on('keyup', e => {
    if (![38, 40, 13].includes(e.keyCode)) return;

    const activeClass = 'search__result--active';
    const current = searchElement.querySelector(`.${activeClass}`);
    const items = searchElement.querySelectorAll('.search__result');
    let next;

    if (e.keyCode === 40 && current) {
      next = current.nextElementSibling || items[0];
    } else if (e.keyCode === 40) {
      next = items[0];
    } else if (e.keyCode === 38 && current) {
      next = current.previousSibling || items[items.length - 1];
    } else if (e.keyCode === 38) {
      next = items[items.length - 1];
    } else if (e.keyCode === 13 && current.href) {
      return window.location = current.href;
    }
    
    if (current) current.classList.remove(activeClass);
    next.classList.add(activeClass);
  });

};

export default typeAhead;