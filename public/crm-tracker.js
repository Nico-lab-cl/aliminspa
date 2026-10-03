/**
 * Rastreador de actividad del CRM de Alimin (marketing.aliminspa.cl).
 *
 * Antes iba en línea en src/app/layout.tsx. Ahora lo carga el banner de
 * cookies (src/components/consent) solo si el visitante aceptó marketing:
 * guarda un identificador en localStorage y le manda al CRM cada página y
 * clic, que es seguimiento de comportamiento y la Ley 21.719 pide permiso.
 */
window.AliminCRM = (function() {
  const CRM_API_URL = 'https://marketing.aliminspa.cl';

  function saveLeadId(id) {
    if (id) {
      localStorage.setItem('crm_lead_id', id);
    }
  }

  function getLeadId() {
    return localStorage.getItem('crm_lead_id');
  }

  function getOrCreateAnonymousId() {
    let anonId = localStorage.getItem('crm_anonymous_id');
    if (!anonId) {
      anonId = 'anon_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('crm_anonymous_id', anonId);
    }
    return anonId;
  }

  function associate(leadId, anonymousId) {
    if (!leadId || !anonymousId) return Promise.resolve();
    console.log('[AliminCRM] Asociando lead_id ' + leadId + ' con anonymous_id ' + anonymousId);
    return fetch(CRM_API_URL + '/api/track/associate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ lead_id: leadId, anonymous_id: anonymousId })
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      console.log('[AliminCRM] Asociación completada:', data);
      return data;
    })
    .catch(function(err) { console.error('[AliminCRM] Error al asociar identidad:', err); });
  }

  function trackEvent(eventType, details) {
    if (!details) details = {};
    const leadId = getLeadId();
    const anonymousId = getOrCreateAnonymousId();

    const payload = {
      lead_id: leadId || null,
      anonymous_id: anonymousId,
      event_type: eventType,
      page_url: window.location.href,
      page_title: document.title,
      details: details
    };

    return fetch(CRM_API_URL + '/api/track/activity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      console.log('[AliminCRM] Evento ' + eventType + ' registrado:', data);
      return data;
    })
    .catch(function(err) { console.error('[AliminCRM] Error al registrar evento ' + eventType + ':', err); });
  }

  function trackPageView() {
    const urlParams = new URLSearchParams(window.location.search);
    var urlLeadId = urlParams.get('lead_id');
    var anonId = getOrCreateAnonymousId();

    if (urlLeadId) {
      saveLeadId(urlLeadId);
      associate(urlLeadId, anonId).then(function() {
        trackEvent('PAGE_VISIT', {
          referrer: document.referrer,
          userAgent: navigator.userAgent
        });
      });
    } else {
      trackEvent('PAGE_VISIT', {
        referrer: document.referrer,
        userAgent: navigator.userAgent
      });
    }
  }

  function identify(contactData) {
    if (!contactData || !contactData.email) {
      console.warn('[AliminCRM] Para identificar al lead se requiere al menos un correo electrónico (email).');
      return Promise.reject('Email requerido');
    }
    if (!contactData.source) {
      contactData.source = 'Sitio Web';
    }

    console.log('[AliminCRM] Enviando datos de contacto al CRM...', contactData);
    return fetch(CRM_API_URL + '/api/leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(contactData)
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      if (data.success && data.lead && data.lead.id) {
        const newLeadId = data.lead.id;
        saveLeadId(newLeadId);
        console.log('[AliminCRM] Contacto identificado exitosamente. ID:', newLeadId);
        
        const anonId = getOrCreateAnonymousId();
        return associate(newLeadId, anonId).then(function() {
          trackPageView();
          return data.lead;
        });
      } else {
        throw new Error(data.message || 'Error en respuesta del CRM');
      }
    })
    .catch(function(err) {
      console.error('[AliminCRM] Error al identificar contacto:', err);
      throw err;
    });
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    trackPageView();
  } else {
    document.addEventListener('DOMContentLoaded', trackPageView);
  }

  const originalPushState = history.pushState;
  history.pushState = function() {
    originalPushState.apply(this, arguments);
    setTimeout(function() {
      trackPageView();
    }, 150);
  };

  const originalReplaceState = history.replaceState;
  history.replaceState = function() {
    originalReplaceState.apply(this, arguments);
    setTimeout(function() {
      trackPageView();
    }, 150);
  };

  window.addEventListener('popstate', function() {
    trackPageView();
  });

  document.addEventListener('click', function(e) {
    const target = e.target.closest('.crm-track-click, button, a');
    if (!target) return;

    const text = (target.innerText || target.textContent || '').trim();
    const href = target.getAttribute('href') || '';
    const tagName = target.tagName;
    
    const buttonName = target.getAttribute('data-crm-name') || text || href || 'Elemento Clickeado';
    
    let buttonCategory = target.getAttribute('data-crm-category') || 'General';
    if (href.indexOf('wa.me') !== -1 || href.indexOf('whatsapp') !== -1) {
      buttonCategory = 'WhatsApp';
    } else if (href.startsWith('#')) {
      buttonCategory = 'Sección Hash';
    } else if (tagName === 'A') {
      buttonCategory = 'Enlace Navegación';
    } else if (tagName === 'BUTTON') {
      buttonCategory = 'Botón Acción';
    }

    trackEvent('CLICK_BUTTON', {
      element_name: buttonName,
      category: buttonCategory,
      href: href,
      tag: tagName
    });
  });

  window.trackCRMEvent = function(eventType, details) {
    trackEvent(eventType, details);
  };

  return {
    identify: identify,
    trackPageView: trackPageView,
    trackEvent: trackEvent,
    getLeadId: getLeadId,
    getOrCreateAnonymousId: getOrCreateAnonymousId
  };
})();
