import React, { useState, useCallback } from 'react';
import {
  T, Icon, btnSt, inputSt,
  BrandCtx, NotesEditCtx,
  ContentPanel, SignPanel, SymbolsPanel,
  AnnotatorModal, Canvas, ThumbnailPalette,
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

const EMPTY_BRAND = {
  officialLogo:'', wmLogo:'', shopLogos:{}, stampLogo:'', setBrand:()=>{},
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
function FastRail({ active, onPick, onCapture, onExport }) {
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

      <div style={{ padding:'0 12px', display:'flex', flexDirection:'column', gap:8 }}>
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

// ── Pannello laterale (dispatcher) ──────────────────────────────────────
function FastInspector({ step, state, update, user, onOpenAnnotator }) {
  const meta = FAST_STEPS.find(s => s.id === step) || FAST_STEPS[0];
  return (
    <section style={{
      width:340, flexShrink:0,
      background:T.surface, borderRight:`1px solid ${T.line}`,
      overflowY:'auto', display:'flex', flexDirection:'column',
    }}>
      <div style={{
        padding:'20px 22px 14px', borderBottom:`1px solid ${T.lineSoft}`,
        background:T.surface, position:'sticky', top:0, zIndex:5,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <Icon name={meta.icon} size={18} color={T.navy}/>
          <h2 style={{ fontSize:16, fontWeight:600, color:T.ink, margin:0 }}>{meta.label}</h2>
        </div>
        <p style={{ fontSize:12, color:T.ink3, lineHeight:1.5, margin:'6px 0 0' }}>
          {STEP_DESC[step]}
        </p>
      </div>
      <div style={{ padding:'16px 22px 60px', display:'flex', flexDirection:'column', gap:18 }}>
        {step === 'content' && <ContentPanel state={state} update={update}/>}
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

  const handleCapture = async () => {
    try {
      const { default: html2canvas } = await import('html2canvas');
      const el = document.querySelector('.fast-canvas-area');
      if (!el) return;
      const canvas = await html2canvas(el, { scale:2, useCORS:true, backgroundColor:'#F4F1EA' });
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = 'fast-capture.png';
      a.click();
    } catch {
      alert('html2canvas non disponible. Installez-le avec : npm i html2canvas');
    }
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

  return (
    <BrandCtx.Provider value={EMPTY_BRAND}>
      <div style={{ display:'flex', flex:1, overflow:'hidden', minHeight:0 }}>

        <FastRail
          active={activeStep} onPick={setActiveStep}
          onCapture={handleCapture} onExport={handleExport}
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
          />
          <ThumbnailPalette
            state={state} activePage={activePage} onPageClick={setActivePage}
            thumbSize={thumbSize} setThumbSize={setThumbSize}
            onOpenVueEnsemble={() => {}}
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

      </div>
    </BrandCtx.Provider>
  );
}
