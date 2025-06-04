const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = ''; // set your API key here or via environment

const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const messageArea = document.getElementById('messageArea');
const loader = document.getElementById('loader');
const searchResults = document.getElementById('searchResults');
const actions = document.getElementById('actions');
const summaryBtn = document.getElementById('summaryBtn');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modalTitle');
const modalContent = document.getElementById('modalContent');
const modalClose = document.getElementById('modalClose');

async function callGroq(prompt, needsJson = false) {
  const body = {
    model: 'llama3-70b-8192',
    messages: [
      { role: 'system', content: needsJson ? 'Return valid JSON only' : '' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.2
  };
  if (needsJson) {
    body.response_format = { type: 'json_object' };
  }
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    throw new Error('API error');
  }
  const result = await response.json();
  let content = result.choices[0].message.content;
  if (needsJson) {
    try {
      content = JSON.parse(content);
    } catch (err) {
      console.error('Invalid JSON from Groq', content);
      throw new Error('Failed to parse JSON');
    }
  }
  return content;
}

function clearUI() {
  searchResults.innerHTML = '';
  actions.innerHTML = '';
  messageArea.textContent = '';
  summaryBtn.classList.add('hidden');
}

function showLoader(show) {
  loader.classList.toggle('hidden', !show);
}

function showModal(title, content) {
  modalTitle.textContent = title;
  modalContent.textContent = content;
  modal.classList.remove('hidden');
}

function closeModal() {
  modal.classList.add('hidden');
}

modalClose.addEventListener('click', closeModal);

async function search() {
  const query = searchInput.value.trim();
  if (!query) return;
  clearUI();
  showLoader(true);
  try {
    const [results, act] = await Promise.all([
      callGroq(`Generate 2-3 mock search results for "${query}" as JSON array with {title, link, description}`, true),
      callGroq(`Generate 3-5 contextual actions for "${query}". Each action should include {label, type, prompt? , info?} in JSON array`, true)
    ]);
    displayResults(results);
    displayActions(act);
    if (results.length) summaryBtn.classList.remove('hidden');
  } catch (err) {
    console.error(err);
    messageArea.textContent = err.message;
  } finally {
    showLoader(false);
  }
}

function displayResults(results) {
  results.forEach((r, idx) => {
    const card = document.createElement('div');
    card.className = 'p-4 bg-white rounded shadow';
    card.innerHTML = `<h3 class="font-bold">${r.title}</h3>
      <a href="${r.link}" class="text-blue-500" target="_blank">${r.link}</a>
      <p>${r.description}</p>
      <button data-idx="${idx}" class="expand mt-2 px-2 py-1 bg-purple-500 text-white rounded">✨ Expand</button>`;
    searchResults.appendChild(card);
  });
}

function displayActions(act) {
  act.forEach((a, idx) => {
    const btn = document.createElement('button');
    btn.className = 'px-3 py-1 bg-gray-200 rounded';
    btn.textContent = a.label;
    btn.dataset.idx = idx;
    btn.dataset.type = a.type;
    if (a.prompt) btn.dataset.prompt = a.prompt;
    if (a.info) btn.dataset.info = a.info;
    btn.addEventListener('click', handleAction);
    actions.appendChild(btn);
  });
}

async function handleAction(e) {
  const type = e.target.dataset.type;
  if (type === 'generate_text') {
    const prompt = e.target.dataset.prompt;
    try {
      showLoader(true);
      const content = await callGroq(prompt, false);
      showModal('Generated Text', content);
    } catch (err) {
      messageArea.textContent = err.message;
    } finally {
      showLoader(false);
    }
  } else if (type === 'info') {
    const info = e.target.dataset.info;
    showModal('Info', info);
  } else if (type === 'open_url') {
    const url = e.target.dataset.prompt;
    window.open(url, '_blank');
  } else if (type === 'new_search') {
    searchInput.value = e.target.dataset.prompt;
    search();
  }
}

summaryBtn.addEventListener('click', async () => {
  const results = Array.from(searchResults.querySelectorAll('div')).map(div => {
    const title = div.querySelector('h3').textContent;
    const desc = div.querySelector('p').textContent;
    return { title, description: desc };
  });
  try {
    showLoader(true);
    const prompt = `Summarize the following search results: ${JSON.stringify(results)}`;
    const summary = await callGroq(prompt, false);
    showModal('Summary', summary);
  } catch (err) {
    messageArea.textContent = err.message;
  } finally {
    showLoader(false);
  }
});

searchBtn.addEventListener('click', search);

searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') search();
});

searchResults.addEventListener('click', async (e) => {
  if (e.target.classList.contains('expand')) {
    const idx = e.target.dataset.idx;
    const card = searchResults.children[idx];
    const title = card.querySelector('h3').textContent;
    const desc = card.querySelector('p').textContent;
    const prompt = `Expand on search result with title "${title}" and description "${desc}"`;
    try {
      showLoader(true);
      const content = await callGroq(prompt, false);
      showModal('More Info', content);
    } catch (err) {
      messageArea.textContent = err.message;
    } finally {
      showLoader(false);
    }
  }
});
