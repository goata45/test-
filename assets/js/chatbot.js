/* =========================================================
   D & N Atelier Assistant
   ---------------------------------------------------------
   A fully client-side conversational assistant. It has no
   backend and calls no external AI API — by design.

   Why: a real generative model (e.g. an LLM API) needs a
   server to hold the API key (never safe to embed in
   front-end JS) and it can fabricate answers — wrong hours,
   invented pricing, imaginary warranty terms — which is a
   real liability for a business. This assistant instead
   matches visitor questions against a knowledge base of only
   verified facts about D&N, and gives in-depth, multi-part
   answers assembled from that real content. Anything it
   doesn't know, it says so and hands off to a phone call or
   the contact form rather than guessing.

   To upgrade to a real LLM later: replace getBotResponse()
   with a fetch() to your backend endpoint, and keep this
   file's knowledge base as the grounding/system-prompt data.
   ========================================================= */
(() => {
  'use strict';

  const PHONE_DISPLAY = '(416) 243-5451';
  const PHONE_HREF = 'tel:+14162435451';
  const ADDRESS = '1160 Weston Rd, Toronto, ON M6M 4P4';

  /* ---------------- Knowledge base ---------------- */
  // Each intent: id, patterns (keywords/phrases to match), response (string, may include simple HTML), quickReplies (follow-up chip labels -> reuse pattern text as the "question")
  const INTENTS = [
    {
      id: 'greeting',
      patterns: ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', "what's up", 'yo'],
      response: () =>
        `Hello! I'm the D&amp;N Atelier Assistant. I can walk you through our services, materials, process, hours, or help you book a consultation. What would you like to know?`,
      quickReplies: ['What services do you offer?', 'Where are you located?', 'How much does it cost?', 'Book a consultation'],
    },
    {
      id: 'services_overview',
      patterns: ['service', 'services', 'what do you do', 'what do you offer', 'what can you do', 'capabilities', 'what kind of work'],
      response: () =>
        `<p>D&amp;N is a full-service atelier — six crafts, one workshop:</p>
         <p><strong>1. Custom Reupholstery</strong> — sofas, sectionals, dining chairs and heirloom pieces, in the fabric or leather of your choice.<br>
         <strong>2. Furniture Refinishing &amp; Restoration</strong> — wood frames stripped, repaired and refinished.<br>
         <strong>3. Custom-Made Furniture</strong> — bespoke sofas, chairs and headboards built to spec.<br>
         <strong>4. Cabinetry</strong> — custom-built and finished to match your home.<br>
         <strong>5. Flooring</strong> — supply and installation.<br>
         <strong>6. Drapery &amp; Soft Furnishings</strong> — custom drapery, cushions and soft furnishings.</p>
         <p>Ask me about any one of these and I'll go deeper.</p>`,
      quickReplies: ['Tell me about reupholstery', 'Tell me about refinishing', 'What materials do you use?'],
    },
    {
      id: 'reupholstery',
      patterns: ['reupholster', 'reupholstery', 'upholster', 'upholstery', 'recover', 'recovering', 'sofa', 'couch', 'sectional', 'dining chair', 'armchair', 'chair fabric'],
      response: () =>
        `<p><strong>Custom Reupholstery</strong> is one of our core crafts. We take sofas, sectionals, dining chairs, armchairs and heirloom pieces and rebuild them — new padding and support where needed, then finished in the fabric or leather you choose.</p>
         <p>Because the frame is inspected and repaired as part of the job, reupholstery is often a better long-term value than buying new, especially for a well-built older piece.</p>
         <p>Bring the piece (or a photo of it) to a consultation and we'll assess the frame and talk through fabric options.</p>`,
      quickReplies: ['What fabric options do you have?', 'How much does it cost?', 'How long does it take?'],
    },
    {
      id: 'refinishing',
      patterns: ['refinish', 'refinishing', 'restoration', 'restore', 'wood repair', 'strip', 'stripping', 'frame repair', 'scratch', 'damaged', 'water damage', 'refinishing wood'],
      response: () =>
        `<p><strong>Furniture Refinishing &amp; Restoration</strong> focuses on the wood: stripping old finish, repairing structural damage (loose joints, cracked frames, water damage), and refinishing to restore both strength and original beauty.</p>
         <p>Our philosophy is restoration-first — a well-built frame can outlive several cheaper replacements, so we'd rather rebuild it than send it to landfill.</p>`,
      quickReplies: ['What finishes do you offer?', 'How much does it cost?', 'Book a consultation'],
    },
    {
      id: 'custom_furniture',
      patterns: ['custom furniture', 'bespoke', 'made to order', 'headboard', 'build me a', 'custom sofa', 'custom chair', 'build furniture'],
      response: () =>
        `<p><strong>Custom-Made Furniture</strong> — we build bespoke sofas, chairs and headboards from scratch to your exact specifications: dimensions, frame style, fill, and fabric or leather, all decided with you at the consultation.</p>`,
      quickReplies: ['What materials do you use?', 'Book a consultation'],
    },
    {
      id: 'cabinetry',
      patterns: ['cabinet', 'cabinetry', 'kitchen cabinet', 'built-in', 'millwork', 'shelving'],
      response: () =>
        `<p><strong>Cabinetry</strong> — custom cabinetry crafted and finished in-house to match your home's architecture and style, whether that's a kitchen refresh or built-ins for another room.</p>`,
      quickReplies: ['What materials do you use?', 'Book a consultation'],
    },
    {
      id: 'flooring',
      patterns: ['floor', 'flooring', 'hardwood', 'wood floor', 'install floor'],
      response: () =>
        `<p><strong>Flooring</strong> — we supply and install flooring, finished with the same attention to detail as our furniture work. Ask us about wide-plank oak if you want it to match refinished wood furniture in the same room.</p>`,
      quickReplies: ['Book a consultation', "What's your process?"],
    },
    {
      id: 'drapery',
      patterns: ['drape', 'drapery', 'curtain', 'curtains', 'cushion', 'cushions', 'soft furnishings', 'pillow', 'pillows'],
      response: () =>
        `<p><strong>Drapery &amp; Soft Furnishings</strong> — custom drapery, cushions and soft furnishings, tailored to complete a room once the furniture and finishes are settled.</p>`,
      quickReplies: ['Book a consultation', 'What materials do you use?'],
    },
    {
      id: 'materials',
      patterns: ['material', 'materials', 'fabric', 'fabrics', 'leather', 'linen', 'velvet', 'walnut', 'boucle', 'bouclé', 'oak', 'finish options', 'colour options', 'color options', 'swatch', 'swatches'],
      response: () =>
        `<p>Our atelier palette spans a wide range, including:</p>
         <p>&bull; <strong>Aniline Leather</strong> — full-grain, hand-conditioned<br>
         &bull; <strong>Belgian Linen</strong> — woven, natural fibre<br>
         &bull; <strong>Performance Velvet</strong> — deep pile, family-friendly<br>
         &bull; <strong>Solid Walnut</strong> — hand-rubbed oil finish<br>
         &bull; <strong>Bouclé Weave</strong> — textured, tonal loop<br>
         &bull; <strong>Wide-Plank Oak</strong> — for flooring and cabinetry</p>
         <p>That's a sample, not the full range — bring your own fabric too if you have one in mind, or we'll help you choose one during a consultation.</p>`,
      quickReplies: ["What's your process?", 'Book a consultation'],
    },
    {
      id: 'process',
      patterns: ['process', 'how does it work', 'steps', 'what happens', 'how do you work', 'what is the process'],
      response: () =>
        `<p>Our process has four steps:</p>
         <p><strong>1. Consultation</strong> — at our Weston Rd showroom or in your home.<br>
         <strong>2. Fabric &amp; Finish Selection</strong> — from our curated range, or your own material.<br>
         <strong>3. Handcrafted In-House</strong> — stripped, repaired, rebuilt and finished entirely by our craftspeople in Toronto.<br>
         <strong>4. Delivery &amp; Install</strong> — we deliver, and install where applicable.</p>`,
      quickReplies: ['How long does it take?', 'Book a consultation'],
    },
    {
      id: 'pricing',
      patterns: ['price', 'prices', 'pricing', 'cost', 'costs', 'how much', 'quote', 'estimate', 'expensive', 'cheap', 'budget', 'rate', 'rates'],
      response: () =>
        `<p>Honestly — it depends. Reupholstery and restoration pricing is driven by the piece's size and condition, the fabric or leather you choose, and how much frame or structural work is needed, so we don't publish a flat price list.</p>
         <p>The most accurate way to get a number is a quick consultation (in person or with photos) — we'll give you a real estimate before any work starts. There's no cost to ask.</p>`,
      quickReplies: ['Book a consultation', 'How long does it take?'],
    },
    {
      id: 'turnaround',
      patterns: ['how long', 'turnaround', 'timeline', 'weeks', 'when will it be ready', 'duration', 'how fast'],
      response: () =>
        `<p>Turnaround varies by project — a single chair moves faster than a full sectional or a multi-room cabinetry job, and it also depends on current workload in the workshop.</p>
         <p>We'll give you a realistic timeline at your consultation once we've actually seen the piece or scope, rather than a generic number that might not hold up.</p>`,
      quickReplies: ['Book a consultation', 'How much does it cost?'],
    },
    {
      id: 'hours_location',
      patterns: ['hours', 'open', 'address', 'location', 'where are you', 'directions', 'visit', 'showroom', 'when are you open', 'what time'],
      response: () =>
        `<p>We're at <strong>${ADDRESS}</strong>.</p>
         <p>Open <strong>Monday–Friday, 9:00 AM – 6:00 PM</strong>. Showroom visits and in-home consultations are by appointment — call ahead at <a href="${PHONE_HREF}">${PHONE_DISPLAY}</a> to book a time.</p>
         <p>You can see the map and get directions in the <a href="#contact">Contact section</a> below.</p>`,
      quickReplies: ['Book a consultation', 'Do you serve my area?'],
    },
    {
      id: 'contact_booking',
      patterns: ['book', 'appointment', 'consultation', 'contact', 'call', 'phone number', 'email', 'schedule', 'get in touch', 'talk to someone'],
      response: () =>
        `<p>You can book a consultation any of these ways:</p>
         <p>&bull; Call <a href="${PHONE_HREF}">${PHONE_DISPLAY}</a> (Mon–Fri, 9–6)<br>
         &bull; Fill out the <a href="#contact">consultation request form</a> further down this page<br>
         &bull; Visit the showroom at ${ADDRESS} by appointment</p>`,
      quickReplies: ['Where are you located?', 'How much does it cost?'],
    },
    {
      id: 'service_area',
      patterns: ['gta', 'toronto', 'mississauga', 'brampton', 'etobicoke', 'north york', 'scarborough', 'vaughan', 'do you come to', 'service area', 'travel', 'do you deliver'],
      response: () =>
        `<p>Yes — we serve the Greater Toronto Area. In-home consultations, delivery and installation (where applicable) are all available beyond our Weston Rd showroom. Mention your neighbourhood when you call and we'll confirm.</p>`,
      quickReplies: ['Book a consultation', 'Where are you located?'],
    },
    {
      id: 'philosophy_sustainability',
      patterns: ['sustainable', 'sustainability', 'eco', 'environment', 'environmentally', 'why restore', 'philosophy', 'why choose you', 'why should i', 'landfill'],
      response: () =>
        `<p>We believe well-built furniture deserves to be renewed, not replaced. A solid frame can outlive several cheaper new sofas — restoring it is often better for your wallet and keeps a usable piece out of landfill.</p>
         <p>That restoration-first approach runs through everything we do, from reupholstery to cabinetry.</p>`,
      quickReplies: ['What services do you offer?', 'Book a consultation'],
    },
    {
      id: 'about',
      patterns: ['who are you', 'about you', 'about d&n', 'history', 'family owned', 'how long have you been', 'tell me about d&n', 'who is d&n'],
      response: () =>
        `<p>D&amp;N Custom Upholstery &amp; Furniture Refinishing is a full-service atelier on Weston Rd in Toronto, offering reupholstery, wood refinishing, custom furniture, cabinetry, flooring and drapery — all done in-house by hand rather than farmed out to subcontractors.</p>
         <p>You can read more in the <a href="#about">About section</a> above.</p>`,
      quickReplies: ['What services do you offer?', 'Book a consultation'],
    },
    {
      id: 'warranty',
      patterns: ['warranty', 'guarantee', 'insured', 'insurance', 'liability'],
      response: () =>
        `<p>I don't want to guess on warranty or insurance specifics since those terms can vary by project — that's best confirmed directly with the team. Call <a href="${PHONE_HREF}">${PHONE_DISPLAY}</a> and ask, they'll give you a straight answer.</p>`,
      quickReplies: ['Book a consultation', 'Where are you located?'],
    },
    {
      id: 'human_handoff',
      patterns: ['talk to a person', 'real person', 'speak to a human', 'human', 'agent', 'representative', 'talk to staff'],
      response: () =>
        `<p>Of course — the fastest way to reach a real person is by phone: <a href="${PHONE_HREF}">${PHONE_DISPLAY}</a>, Mon–Fri 9–6. Or send details through the <a href="#contact">contact form</a> and the team will get back to you directly.</p>`,
      quickReplies: [],
    },
    {
      id: 'thanks',
      patterns: ['thanks', 'thank you', 'appreciate it', 'thx', 'ty'],
      response: () => `You're welcome! Anything else I can help with — services, pricing, hours, or booking?`,
      quickReplies: ['What services do you offer?', 'Book a consultation'],
    },
    {
      id: 'bye',
      patterns: ['bye', 'goodbye', "that's all", 'no thanks', 'see you', 'nothing else'],
      response: () => `Sounds good — thanks for stopping by. You can always reach us at <a href="${PHONE_HREF}">${PHONE_DISPLAY}</a> if anything comes up.`,
      quickReplies: [],
    },
  ];

  const FALLBACK_RESPONSE = () =>
    `<p>I'm not certain I can answer that accurately, and I'd rather not guess. For anything outside services, materials, process, pricing, hours or booking, the team can help directly — call <a href="${PHONE_HREF}">${PHONE_DISPLAY}</a> or use the <a href="#contact">contact form</a>.</p>`;
  const FALLBACK_QUICK_REPLIES = ['What services do you offer?', 'How much does it cost?', 'Book a consultation'];

  /* ---------------- Matching engine ---------------- */
  function normalize(str) {
    return str.toLowerCase().replace(/[^\w\s'&-]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Word-boundary matching, not plain substring — otherwise short patterns like
  // "yo" false-positive inside ordinary words like "you" or "your".
  function scoreIntent(message, intent) {
    let score = 0;
    for (const pattern of intent.patterns) {
      const re = new RegExp('\\b' + escapeRegex(pattern) + '\\b');
      if (re.test(message)) {
        score += pattern.split(' ').length; // multi-word phrase matches weigh more
      }
    }
    return score;
  }

  function getBotResponse(rawMessage) {
    const message = normalize(rawMessage);
    let best = null;
    let bestScore = 0;
    for (const intent of INTENTS) {
      const score = scoreIntent(message, intent);
      if (score > bestScore) {
        bestScore = score;
        best = intent;
      }
    }
    if (!best || bestScore === 0) {
      return { html: FALLBACK_RESPONSE(), quickReplies: FALLBACK_QUICK_REPLIES };
    }
    return { html: best.response(), quickReplies: best.quickReplies || [] };
  }

  /* ---------------- UI wiring ---------------- */
  const widget = document.getElementById('chatWidget');
  const launcher = document.getElementById('chatLauncher');
  const panel = document.getElementById('chatPanel');
  const closeBtn = document.getElementById('chatClose');
  const messagesEl = document.getElementById('chatMessages');
  const quickRepliesEl = document.getElementById('chatQuickReplies');
  const form = document.getElementById('chatForm');
  const input = document.getElementById('chatInput');
  const badge = document.getElementById('chatBadge');

  let opened = false;

  function appendMessage(role, html) {
    const el = document.createElement('div');
    el.className = `chat-msg ${role}`;
    if (role === 'user') {
      el.textContent = html; // user text is always inserted as plain text, never HTML
    } else {
      el.innerHTML = html; // bot HTML is authored in this file only, never from user input
    }
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return el;
  }

  function setQuickReplies(labels) {
    quickRepliesEl.innerHTML = '';
    labels.forEach((label) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chat-chip';
      chip.textContent = label;
      chip.addEventListener('click', () => sendMessage(label));
      quickRepliesEl.appendChild(chip);
    });
  }

  function showTyping() {
    const el = document.createElement('div');
    el.className = 'chat-typing';
    el.id = 'chatTypingIndicator';
    el.innerHTML = '<span></span><span></span><span></span>';
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }
  function hideTyping() {
    const el = document.getElementById('chatTypingIndicator');
    if (el) el.remove();
  }

  function sendMessage(text) {
    const trimmed = text.trim();
    if (!trimmed) return;
    appendMessage('user', trimmed);
    setQuickReplies([]);
    input.value = '';
    showTyping();
    const delay = 450 + Math.min(trimmed.length * 12, 700);
    setTimeout(() => {
      hideTyping();
      const { html, quickReplies } = getBotResponse(trimmed);
      appendMessage('bot', html);
      setQuickReplies(quickReplies);
    }, delay);
  }

  function openChat() {
    opened = true;
    widget.classList.add('open');
    panel.hidden = false;
    launcher.setAttribute('aria-expanded', 'true');
    badge.classList.add('hidden');
    if (!messagesEl.dataset.greeted) {
      messagesEl.dataset.greeted = '1';
      showTyping();
      setTimeout(() => {
        hideTyping();
        appendMessage(
          'bot',
          `<p>Hi, I'm the D&amp;N Atelier Assistant. Ask me about our services, materials, process, pricing, hours, or how to book a consultation — I'll give you real, accurate answers grounded in what D&amp;N actually offers.</p>`
        );
        setQuickReplies(['What services do you offer?', 'Where are you located?', 'How much does it cost?', 'Book a consultation']);
      }, 500);
    }
    setTimeout(() => input.focus(), 320);
  }

  function closeChat() {
    opened = false;
    widget.classList.remove('open');
    panel.hidden = true;
    launcher.setAttribute('aria-expanded', 'false');
    launcher.focus();
  }

  launcher.addEventListener('click', () => (opened ? closeChat() : openChat()));
  closeBtn.addEventListener('click', closeChat);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && opened) closeChat();
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    sendMessage(input.value);
  });

  // Invite engagement a few seconds after page load if the visitor hasn't opened it yet.
  setTimeout(() => {
    if (!opened) badge.classList.remove('hidden');
  }, 4000);
})();
