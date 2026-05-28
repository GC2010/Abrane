import React, { useState, useCallback, useEffect } from 'react';
import { loadOfficialTemplate } from '../lib/db';
import {
  T, Icon, btnSt, inputSt,
  BrandCtx, NotesEditCtx,
  ContentPanel, SignPanel, SymbolsPanel,
  AnnotatorModal, Canvas, ThumbnailPalette,
  VueEnsembleModal,
  defaultLogoUrl,
} from '../App';

// ── Costanti ────────────────────────────────────────────────────────────
const FAST_STEPS = [
  { id:'content',  label:'Contenu',   sub:'PDF, images',   icon:'doc'       },
  { id:'annoter',  label:'Annoter',   sub:'Annotations',   icon:'pencil'    },
  { id:'sign',     label:'Signature', sub:'Filigrane',     icon:'signature' },
  { id:'sym',      label:'Symboles',  sub:'Icônes flott.', icon:'sparkle'   },
];

const STEP_DESC = {
  content:  'Glissez PDF et images. Organisez par catégories.',
  annoter:  "Sélectionnez une page pour l'annoter avec Fabric.",
  sign:     'Signature, filigrane et tampon optionnels.',
  sym:      "Symbole d'avertissement et badge d'avancement.",
};


// ── État minimal compatible avec ContentPanel / SignPanel / SymbolsPanel ─
const initFastState = () => ({
  files:[], contentOrder:[], pageNotes:{}, contentZoom:{}, contentPos:{},
  annotations:{}, annotSnaps:{},
  pageFormat:'h-full',
  palette:{ c1:'#E8DCC8', c2:'#C8A96E', c3:'#2B2B2B' },
  // Sign
  sigEnabled:false, sigPlacement:'all', sigUrl:'',
  sigScale:30, sigX:78, sigY:88, groupX:50, groupY:85,
  wmEnabled:false, wmOpacity:10,
  stampEnabled:false, stampOpacity:70, stampScale:25, stampX:50, stampY:50, stampPlacement:'all',
  // Sym
  symEnabled:false, symPlacement:'all', symText:'', symScale:20, symX:50, symY:50, symPageNum:1,
  advEnabled:false, advStatus:'AF', advPlacement:'all', advScale:15, advX:85, advY:8, advPageNum:1,
  disclaimerEnabled:false, disclaimerLang:'fr', disclaimerPlacement:'all',
  disclaimerSize:6, disclaimerX:50, disclaimerY:95, disclaimerPageNum:1,
  // Campi minimi richiesti da Canvas / PageRender
  client:'', subtitle:'', mainTitle:'', name:'',
  enIdx:false, enMat:false, enNotes:false, idxMode:'all', thumbCount:0,
  materials:[], backLines:[], backDecor:'',
  logoScale:100, logoX:80, logoY:5, clientLogoUrl:'',
  bgImageUrl:'', bgX:50, bgY:50, bgScale:100,
  stripeLogoScale:80, stripeLogoY:0,
  showQuoteRef:false, quoteRef:'', showInternalRef:false, internalRef:'',
  showContact:false, contact:'', showSendDate:false, sendDate:'',
  showProjectType:false, projectType:'', tags:[],
  notes:[''], noteContent:'', noteHtml:'', rev:'', year:'', projectDate:'',
  _dirty:false,
});

// ── Rail semplificata (4 voci) ──────────────────────────────────────────
function FastRail({ active, onPick, onCapture, onCopy, onExport, useTemplate, onToggleTemplate }) {
  return (
    <aside style={{
      width:210, flexShrink:0,
      background:'#F7F4EE', borderRight:`1px solid ${T.line}`,
      display:'flex', flexDirection:'column', padding:'0 0 20px',
    }}>
      <div style={{ padding:'14px 16px 12px', borderBottom:`1px solid ${T.lineSoft}` }}>
        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
          <div style={{
            width:18, height:18, borderRadius:4, flexShrink:0,
            background:`linear-gradient(135deg,${T.navy},${T.gold})`,
          }}/>
          <span style={{ fontSize:11, fontWeight:700, color:T.navy, letterSpacing:'.12em', textTransform:'uppercase' }}>
            Fast Mode
          </span>
        </div>
        <div style={{ fontSize:10, color:T.ink4, marginTop:3, lineHeight:1.4 }}>
          Rapide · Sans enregistrement
        </div>
      </div>

      <div style={{ flex:1, padding:'8px 0' }}>
        {FAST_STEPS.map((s, i) => {
          const isOn = s.id === active;
          return (
            <button key={s.id} onClick={() => onPick(s.id)} style={{
              display:'flex', alignItems:'center', gap:10,
              padding: isOn ? '9px 0 9px 14px' : '7px 8px 7px 14px',
              width:'100%', border:'none', cursor:'pointer',
              fontFamily:'inherit', textAlign:'left',
              background: isOn ? T.surface : 'transparent',
              borderLeft:`3px solid ${isOn ? T.navy : 'transparent'}`,
              marginRight: isOn ? -1 : 0,
              boxShadow: isOn ? '2px 0 0 #fff, 0 2px 12px rgba(15,31,71,.07)' : undefined,
              transition:'background .15s',
            }}>
              <div style={{
                width:22, height:22, borderRadius:'50%', flexShrink:0,
                background: isOn ? T.navy : 'transparent',
                border:`1.5px solid ${isOn ? T.navy : T.lineStrong}`,
                display:'grid', placeItems:'center',
                fontSize:10, fontWeight:700, color: isOn ? '#fff' : T.ink4,
              }}>{i + 1}</div>
              <Icon name={s.icon} size={14} color={isOn ? T.navy : T.ink4} style={{flexShrink:0}}/>
              <div style={{ minWidth:0, flex:1 }}>
                <div style={{ fontSize:12.5, fontWeight:isOn?700:500, color:isOn?T.ink:T.ink3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                  {s.label}
                </div>
                <div style={{ fontSize:10, color:isOn?T.ink4:T.ink5, marginTop:1 }}>{s.sub}</div>
              </div>
            </button>
          );
        })}
      </div>

      <div style={{ padding:'0 12px 14px', display:'flex', flexDirection:'column', gap:8 }}>
        {/* Copie contenu dans le presse-papiers */}
        <button onClick={onCopy} style={{
          ...btnSt('primary'), justifyContent:'center', width:'100%',
          background:`linear-gradient(135deg,#6366F1,#4F46E5)`,
          border:'none', fontSize:13, fontWeight:700, padding:'11px 10px',
          boxShadow:'0 4px 18px rgba(99,102,241,.35)',
        }}>
          <Icon name="layers" size={14} color="#fff"/>Copier
        </button>
        <div style={{fontSize:9.5,color:T.ink4,textAlign:'center',lineHeight:1.4,padding:'0 4px'}}>
          Pages contenu · prêt à coller
        </div>

        {/* Toggle template — tasto molto visibile */}
        <button onClick={onToggleTemplate} style={{
          padding:'11px 10px', borderRadius:10, cursor:'pointer',
          fontFamily:'inherit', width:'100%',
          display:'flex', alignItems:'center', justifyContent:'center', gap:8,
          fontWeight:700, fontSize:12,
          border: useTemplate ? 'none' : `2px dashed ${T.line}`,
          background: useTemplate
            ? `linear-gradient(135deg,${T.navy},#2A4A8C)`
            : T.surface,
          color: useTemplate ? '#fff' : T.ink3,
          boxShadow: useTemplate ? '0 4px 18px rgba(27,46,92,.35)' : 'none',
          transition:'all .18s',
        }}>
          <Icon name={useTemplate ? 'doc' : 'folder'} size={15} color={useTemplate ? '#fff' : T.ink4}/>
          <span>{useTemplate ? 'Template ON' : 'Pages seules'}</span>
        </button>
        <div style={{ fontSize:9.5, color:T.ink4, textAlign:'center', lineHeight:1.4, padding:'0 4px' }}>
          {useTemplate ? 'Couverture + pages importées' : 'Fichiers importés uniquement'}
        </div>

        <button onClick={onCapture} style={{ ...btnSt('primary'), justifyContent:'center', width:'100%' }}>
          <Icon name="image" size={13} color="#fff"/>Capture
        </button>
        <button onClick={onExport} style={{ ...btnSt('gold'), justifyContent:'center', width:'100%' }}>
          <Icon name="download" size={13} color={T.navy}/>Export JSON
        </button>
      </div>
    </aside>
  );
}

// ── Step "Annoter" : lista pagine con pulsante per aprire AnnotatorModal ─
function AnnoterPanel({ state, onOpenAnnotator }) {
  const fileItems = state.contentOrder.filter(it => it.type === 'file');
  if (!fileItems.length) {
    return (
      <div style={{ fontSize:12.5, color:T.ink3, lineHeight:1.6, padding:'8px 0' }}>
        Importez d'abord des fichiers dans l'étape{' '}
        <strong style={{ color:T.ink }}>Contenu</strong>.
      </div>
    );
  }
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      {fileItems.flatMap(it => {
        const file = state.files.find(f => f.id === it.fileId);
        if (!file) return [];
        return (file.pageUrls || []).map((url, pi) => {
          const pageKey = `f-${it.id}-${pi}`;
          const hasAnnot = !!state.annotations?.[pageKey];
          return (
            <button key={pageKey}
              onClick={() => onOpenAnnotator({
                pageKey, pageUrl:url,
                isPortrait:state.pageFormat.startsWith('v'),
              })}
              style={{
                display:'flex', alignItems:'center', gap:8,
                padding:'8px 10px', borderRadius:7,
                cursor:'pointer', fontFamily:'inherit', textAlign:'left',
                border:`1px solid ${hasAnnot ? T.goldSoft : T.line}`,
                background: hasAnnot ? T.goldTint : T.surface,
              }}>
              <Icon name="pencil" size={12} color={hasAnnot ? T.navy : T.ink3}/>
              <span style={{
                fontSize:11.5, overflow:'hidden', textOverflow:'ellipsis',
                whiteSpace:'nowrap', flex:1, color:T.ink,
              }}>
                {file.name.replace(/\.[^.]+$/, '')}
                {(file.pageUrls?.length||0) > 1 && (
                  <span style={{ color:T.ink3 }}> — p.{pi+1}</span>
                )}
              </span>
              <span style={{
                fontSize:9.5, fontWeight:700,
                color: hasAnnot ? T.navy : T.ink4,
                flexShrink:0, letterSpacing:'.06em',
              }}>
                {hasAnnot ? 'MODIFIER' : 'ANNOTER'}
              </span>
            </button>
          );
        });
      })}
    </div>
  );
}

// ── Sezione meta fissa: titre / sous-titre / révision ───────────────────
function FastMeta({ state, update }) {
  const today = new Date();
  const dateStr = today.toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric' });
  return (
    <div style={{
      padding:'14px 22px 16px', borderBottom:`1px solid ${T.lineSoft}`,
      display:'flex', flexDirection:'column', gap:10,
    }}>
      <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
        <label style={{ fontSize:10, fontWeight:600, color:T.ink4, letterSpacing:'.1em', textTransform:'uppercase' }}>Titre</label>
        <input
          style={{ ...inputSt, fontSize:13, fontWeight:600 }}
          placeholder="Titre du document…"
          value={state.mainTitle || ''}
          onChange={e => update({ mainTitle: e.target.value })}
        />
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
        <label style={{ fontSize:10, fontWeight:600, color:T.ink4, letterSpacing:'.1em', textTransform:'uppercase' }}>Sous-titre</label>
        <input
          style={{ ...inputSt, fontSize:12 }}
          placeholder="Sous-titre…"
          value={state.subtitle || ''}
          onChange={e => update({ subtitle: e.target.value })}
        />
      </div>
      <div style={{ display:'flex', gap:10 }}>
        <div style={{ display:'flex', flexDirection:'column', gap:3, flex:1 }}>
          <label style={{ fontSize:10, fontWeight:600, color:T.ink4, letterSpacing:'.1em', textTransform:'uppercase' }}>Révision</label>
          <input
            style={{ ...inputSt, fontSize:12 }}
            placeholder="Rev.01"
            value={state.rev || ''}
            onChange={e => update({ rev: e.target.value })}
          />
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:3, flex:1 }}>
          <label style={{ fontSize:10, fontWeight:600, color:T.ink4, letterSpacing:'.1em', textTransform:'uppercase' }}>Date</label>
          <div style={{ ...inputSt, fontSize:12, color:T.ink3, background:'#F5F4F2', cursor:'default' }}>{dateStr}</div>
        </div>
      </div>
    </div>
  );
}

// ── Pannello laterale (dispatcher) ──────────────────────────────────────
function FastInspector({ step, state, update, user, onOpenAnnotator }) {
  const meta = FAST_STEPS.find(s => s.id === step) || FAST_STEPS[0];
  return (
    <section style={{
      width:340, flexShrink:0,
      background:T.surface, borderRight:`1px solid ${T.line}`,
      overflowY:'auto', display:'flex', flexDirection:'column',
    }}>
      <FastMeta state={state} update={update}/>
      <div style={{
        padding:'14px 22px 10px', borderBottom:`1px solid ${T.lineSoft}`,
        background:T.surface, position:'sticky', top:0, zIndex:5,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <Icon name={meta.icon} size={18} color={T.navy}/>
          <h2 style={{ fontSize:15, fontWeight:600, color:T.ink, margin:0 }}>{meta.label}</h2>
        </div>
        <p style={{ fontSize:11.5, color:T.ink3, lineHeight:1.5, margin:'4px 0 0' }}>
          {STEP_DESC[step]}
        </p>
      </div>
      <div style={{ padding:'16px 22px 60px', display:'flex', flexDirection:'column', gap:18 }}>
        {step === 'content' && <ContentPanel state={state} update={update} prominent/>}
        {step === 'annoter' && <AnnoterPanel state={state} onOpenAnnotator={onOpenAnnotator}/>}
        {step === 'sign'    && <SignPanel    state={state} update={update} user={user}/>}
        {step === 'sym'     && <SymbolsPanel state={state} update={update}/>}
      </div>
    </section>
  );
}

// ── Componente principale ────────────────────────────────────────────────
export default function FastMode({ user }) {
  const [activeStep, setActiveStep]         = useState('content');
  const [state, setState]                   = useState(initFastState);
  const [annotating, setAnnotating]         = useState(null);
  const [zoom, setZoom]                     = useState(1);
  const [activePage, setActivePage]         = useState(0);
  const [thumbSize, setThumbSize]           = useState('M');
  const [paletteCollapsed, setPaletteCollapsed] = useState(false);
  const [useTemplate, setUseTemplate]       = useState(true);
  const [showVueEnsemble, setShowVueEnsemble] = useState(false);

  // Carica il template ufficiale ABRANE per cover + back
  useEffect(() => {
    const today = new Date();
    const autoDate = today.toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric' });
    const autoYear = String(today.getFullYear());
    loadOfficialTemplate().then(record => {
      const tpl = record?.data || {};
      setState(s => ({
        ...s,
        ...tpl,
        // Data automatica
        projectDate: autoDate,
        year: autoYear,
        // FastMode : sempre senza index, materiali, notes
        enIdx: false, enMat: false, enNotes: false,
        // Dati aziendali back page — usa quelli del template se presenti
        backLines: (tpl.backLines?.length ? tpl.backLines : [
          'ABRANE — Le fabricant de mobilier',
          'contact@abrane.fr',
          'www.abrane.fr',
        ]),
        // Preserva i dati FastMode (file importati dall'utente)
        files: s.files,
        contentOrder: s.contentOrder,
        annotations: s.annotations,
        annotSnaps: s.annotSnaps,
        pageNotes: s.pageNotes,
        contentZoom: s.contentZoom,
        contentPos: s.contentPos,
        _dirty: false,
      }));
    }).catch(() => {});
  }, []);

  const update = useCallback(
    patch => setState(s => ({ ...s, ...patch })),
    []
  );
  const updatePageNotes = useCallback((pageKey, html) =>
    setState(s => ({ ...s, pageNotes:{ ...(s.pageNotes||{}), [pageKey]:html } })),
    []
  );

  const PALETTE_H = { S:99, M:122, L:150 };
  const paletteH = paletteCollapsed ? 32 : PALETTE_H[thumbSize];

  const renderPage = async (h2c, idx) => {
    const wrapper = document.querySelector(`[data-page-idx="${idx}"]`);
    const el = wrapper?.querySelector('.page-render-box') || wrapper;
    if (!el) return null;
    const btns = el.querySelectorAll('.annot-btn-overlay');
    btns.forEach(b => { b.style.display = 'none'; });
    try {
      return await h2c(el, { scale:5, useCORS:true, backgroundColor:'#ffffff', logging:false });
    } finally {
      btns.forEach(b => { b.style.display = ''; });
    }
  };

  const renderActivePage = async () => {
    const { default: h2c } = await import('html2canvas');
    const canvas = await renderPage(h2c, activePage);
    if (!canvas) throw new Error('Aucune page à capturer.');
    return canvas;
  };

  const handleCopy = async () => {
    try {
      const { default: h2c } = await import('html2canvas');
      const total = document.querySelectorAll('[data-page-idx]').length;
      if (total < 3) throw new Error('Aucune page de contenu à copier.');
      const dataUrls = [];
      for (let i = 1; i <= total - 2; i++) {
        const c = await renderPage(h2c, i);
        if (c) dataUrls.push(c.toDataURL('image/png'));
      }
      if (!dataUrls.length) throw new Error('Aucune page de contenu à copier.');
      // Each page as a separate <img> — pastes as individual images in Word/PPT/Keynote
      const html = dataUrls.map(src => `<img src="${src}" style="display:block;max-width:100%;"/>`).join('');
      const blob = new Blob([html], { type: 'text/html' });
      await navigator.clipboard.write([new ClipboardItem({ 'text/html': blob })]);
    } catch(e) { alert(e.message || 'Erreur lors de la copie.'); }
  };

  const handleCapture = async () => {
    try {
      const canvas = await renderActivePage();
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = `page-${activePage + 1}.png`;
      a.click();
    } catch(e) { alert(e.message || 'html2canvas non disponible — npm i html2canvas'); }
  };

  const handleExport = () => {
    const { _dirty, sigUrl, ...data } = state;
    const blob = new Blob(
      [JSON.stringify({ version:1, exportedAt:new Date().toISOString(), data }, null, 2)],
      { type:'application/json' }
    );
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `fast-export-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const outerBrand = React.useContext(BrandCtx);
  const safeBrand = React.useMemo(() => ({
    ...outerBrand,
    officialLogo: outerBrand.officialLogo || defaultLogoUrl,
  }), [outerBrand]);

  return (
    <BrandCtx.Provider value={safeBrand}>
    <div style={{ display:'flex', flex:1, overflow:'hidden', minHeight:0 }}>

        <FastRail
          active={activeStep} onPick={setActiveStep}
          onCapture={handleCapture} onCopy={handleCopy} onExport={handleExport}
          useTemplate={useTemplate} onToggleTemplate={() => setUseTemplate(v => !v)}
        />

        <FastInspector
          step={activeStep} state={state} update={update}
          user={user} onOpenAnnotator={setAnnotating}
        />

        <div className="fast-canvas-area"
          style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column', overflow:'hidden' }}>
          <Canvas
            state={state} zoom={zoom} setZoom={setZoom}
            activePage={activePage} paletteH={paletteH}
            onAnnotate={p => setAnnotating({
              pageKey:p.key, pageUrl:p.pageUrl,
              isPortrait:state.pageFormat.startsWith('v'),
            })}
            onUpdatePageNotes={updatePageNotes}
            hideTemplatePages={!useTemplate}
          />
          <ThumbnailPalette
            state={state} activePage={activePage} onPageClick={setActivePage}
            thumbSize={thumbSize} setThumbSize={setThumbSize}
            onOpenVueEnsemble={() => setShowVueEnsemble(true)}
            collapsed={paletteCollapsed} setCollapsed={setPaletteCollapsed}
          />
        </div>

        {annotating && (
          <AnnotatorModal
            state={state} update={update}
            pageKey={annotating.pageKey} pageUrl={annotating.pageUrl}
            isPortrait={annotating.isPortrait}
            onClose={() => setAnnotating(null)}
          />
        )}

        {showVueEnsemble && (
          <VueEnsembleModal
            state={state} update={update}
            onClose={() => setShowVueEnsemble(false)}
          />
        )}

    </div>
    </BrandCtx.Provider>
  );
}
