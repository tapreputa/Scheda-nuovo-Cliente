(() => {
  'use strict';

  if (!window.TapNfc || typeof window.TapNfc.rest !== 'function') return;

  const OPERATORS = [
    'francesco@tapnfc.local',
    'gisberto@tapnfc.local',
    'enzo@tapnfc.local'
  ];

  const originalRest = window.TapNfc.rest.bind(window.TapNfc);
  let currentEmailPromise = null;

  function getCurrentEmail() {
    if (!currentEmailPromise) {
      currentEmailPromise = Promise.resolve(window.TapNfc.getUser())
        .then(user => String(user?.email || '').toLowerCase())
        .catch(() => '');
    }
    return currentEmailPromise;
  }

  function uuid() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  function cloneResponse(response, data) {
    return new Response(JSON.stringify(data), {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
  }

  async function dedupeGroupedMessages(response) {
    if (!response?.ok) return response;

    let rows;
    try {
      rows = await response.clone().json();
    } catch {
      return response;
    }
    if (!Array.isArray(rows) || !rows.some(row => row?.group_id)) return response;

    const currentEmail = await getCurrentEmail();
    const order = [];
    const grouped = new Map();

    for (const row of rows) {
      if (!row?.group_id) {
        order.push({ type: 'row', row });
        continue;
      }
      if (!grouped.has(row.group_id)) {
        grouped.set(row.group_id, []);
        order.push({ type: 'group', id: row.group_id });
      }
      grouped.get(row.group_id).push(row);
    }

    const result = order.map(item => {
      if (item.type === 'row') return item.row;
      const copies = grouped.get(item.id) || [];
      const merged = { ...(copies[0] || {}) };

      // Il mittente vede due righe tecniche (una per ciascun destinatario),
      // ma nell'interfaccia deve comparire un solo messaggio.
      if (String(merged.sender_email || '').toLowerCase() === currentEmail && copies.length > 1) {
        const allRead = copies.every(copy => Boolean(copy.read_at));
        merged.read_at = allRead
          ? copies.map(copy => copy.read_at).filter(Boolean).sort().at(-1) || null
          : null;
      }
      return merged;
    });

    return cloneResponse(response, result);
  }

  window.TapNfc.rest = async function teamAwareRest(path, options = {}) {
    const method = String(options.method || 'GET').toUpperCase();
    const cleanPath = String(path || '');

    // I nuovi messaggi vengono inseriti in un'unica transazione come due copie:
    // una per ciascuno degli altri operatori. Le policy/RLS esistenti continuano
    // quindi a funzionare senza allargare l'accesso ai dati.
    if (method === 'POST' && cleanPath === 'chat_messages') {
      let payload;
      try {
        payload = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
      } catch {
        payload = null;
      }

      if (payload && !Array.isArray(payload) && !payload.recipient_email) {
        const senderEmail = await getCurrentEmail();
        const recipients = OPERATORS.filter(email => email !== senderEmail);
        if (OPERATORS.includes(senderEmail) && recipients.length === 2) {
          const groupId = uuid();
          const rows = recipients.map(recipientEmail => ({
            ...payload,
            recipient_email: recipientEmail,
            group_id: groupId
          }));
          return originalRest(cleanPath, {
            ...options,
            body: JSON.stringify(rows)
          });
        }
      }
    }

    const response = await originalRest(cleanPath, options);

    // Solo le letture della chat necessitano di deduplicazione per il mittente.
    if (method === 'GET' && cleanPath.startsWith('chat_messages?')) {
      return dedupeGroupedMessages(response);
    }

    return response;
  };

  function setTeamHeader() {
    const name = document.getElementById('peerName');
    const avatar = document.getElementById('peerAvatar');
    const note = document.getElementById('peerNote');
    if (name && name.textContent !== 'Team Tap NFC') name.textContent = 'Team Tap NFC';
    if (avatar && avatar.textContent !== '3') avatar.textContent = '3';
    if (note && note.textContent !== 'Francesco · Gisberto · Enzo') {
      note.textContent = 'Francesco · Gisberto · Enzo';
    }
  }

  setTeamHeader();
  const header = document.querySelector('.chat-peer');
  if (header) {
    new MutationObserver(setTeamHeader).observe(header, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }
})();
