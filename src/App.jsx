import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";

const T = {
  bg:"#F4F1EA",surface:"#FFFFFF",panel:"#FAF8F3",panel2:"#F0EBE0",tint:"#FBF7EE",
  line:"#E8E2D6",lineSoft:"#F0EBE0",lineStrong:"#D9D1C0",
  navy:"#1B2E5C",navyTint:"#EEF1F8",
  gold:"#B89556",goldSoft:"#D8C18A",goldTint:"#FBF5E8",
  ink:"#1A1F2E",ink2:"#4A4640",ink3:"#6B6660",ink4:"#9C9690",ink5:"#BCB6AC",
  success:"#2D7A4F",successT:"#E8F2EB",
};

const NotesEditCtx = React.createContext(null);

const PATHS = {
  back:"M15 6l-6 6 6 6",check:"M5 12l4.5 4.5L19 7",plus:"M12 5v14 M5 12h14",
  folder:"M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z",
  users:"M9 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7z M17 12a3 3 0 100-6 3 3 0 000 6z M3 19c0-3 2.7-5 6-5s6 2 6 5 M15 19c0-2 1.7-4 4-4s4 1.5 4 3.5",
  share:"M16 6a2 2 0 100-4 2 2 0 000 4z M8 14a2 2 0 100-4 2 2 0 000 4z M16 22a2 2 0 100-4 2 2 0 000 4z M9.7 11.3l4.6-2.6 M9.7 12.7l4.6 2.6",
  search:"M11 4a7 7 0 100 14 7 7 0 000-14z M20 20l-3.5-3.5",
  grid:"M5 5h6v6H5V5z M13 5h6v6h-6V5z M5 13h6v6H5v-6z M13 13h6v6h-6v-6z",
  layers:"M12 3l9 5-9 5-9-5 9-5z M3 13l9 5 9-5 M3 17l9 5 9-5",
  palette:"M12 3a9 9 0 100 18c1 0 2-.8 2-2v-1c0-1 .8-2 2-2h2a3 3 0 003-3 9 9 0 00-9-9z",
  doc:"M7 3h7l4 4v14H7V3z M14 3v4h4",
  page:"M6 3h12v18H6V3z M9 7h6 M9 10h6 M9 13h4",
  index:"M5 5h14 M5 9h14 M5 13h10 M5 17h6",
  notes:"M6 4h10l4 4v12H6V4z M9 12h7 M9 15h7",
  swatch:"M5 5h6v6H5V5z M13 5h6v6h-6V5z M5 13h6v6H5v-6z M13 13h6v6h-6v-6z",
  cover:"M5 4a1 1 0 00-1 1v14a1 1 0 001 1h14a1 1 0 001-1V5a1 1 0 00-1-1H5z M9 7h10 M9 10h7 M9 13h4",
  fileText:"M7 3h10v18H7V3z M10 8h4 M10 11h4 M10 14h3",
  signature:"M3 17c2-4 4-6 6-6s2 4 4 4 3-3 5-3 3 2 3 2 M3 21h18",
  sparkle:"M12 4l1.5 5.5L19 11l-5.5 1.5L12 18l-1.5-5.5L5 11l5.5-1.5L12 4z",
  cloud:"M7 18a5 5 0 010-10 6 6 0 0111 0 4 4 0 010 8H7z",
  chevD:"M6 9l6 6 6-6",chevR:"M9 18l6-6-6-6",
  close:"M6 6l12 12 M18 6L6 18",
  save:"M5 5a1 1 0 011-1h10l3 3v12a1 1 0 01-1 1H6a1 1 0 01-1-1V5z M7 4v5h8V4 M7 14h10",
  download:"M12 4v11 M7 12l5 5 5-5 M5 20h14",
  eye:"M12 5C7 5 3 9 2 12c1 3 5 7 10 7s9-4 10-7c-1-3-5-7-10-7z M12 9a3 3 0 100 6 3 3 0 000-6z",
  image:"M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5z M4 16l4-4 4 4 3-3 5 5",
  upload:"M12 19V8 M7 11l5-5 5 5 M5 20h14",
  info:"M12 4a8 8 0 100 16 8 8 0 000-16z M12 8h.01 M11 12h1v5h1",
  bookmark:"M7 4h10v17l-5-3-5 3V4z",
  user:"M12 12a4 4 0 100-8 4 4 0 000 8z M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6",
  history:"M4 12a8 8 0 108-8 8 8 0 00-7 4 M4 5v4h4 M12 8v5l3 2",
  archive:"M3 5h18v4H3V5z M5 9v11h14V9 M10 13h4",
  ring:"M9 4h11v16H9V4z M6 6.5h.01 M6 10h.01 M6 13.5h.01 M6 17h.01",
  pageVert:"M6 3h12v18H6V3z",
  trash:"M5 7h14 M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2 M7 7v13a1 1 0 001 1h8a1 1 0 001-1V7",
  lock:"M6 11h12v9H6v-9z M9 11V7a3 3 0 016 0v4",
  refresh:"M4 12a8 8 0 0114-5.3L20 9 M20 4v5h-5",
  star:"M12 4l2.5 5.5L20 11l-4 4 1 6-5-2.7L7 21l1-6-4-4 5.5-1.5L12 4z",
  globe:"M12 4a8 8 0 100 16 8 8 0 000-16z M4 12h16 M12 4a12 8 0 010 16 M12 4a12 8 0 000 16",
  pdf:"M7 3h7l4 4v14H7V3z M14 3v4h4 M9 14h6 M9 17h4",
  folderTeam:"M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z M8 12h8 M8 15h5",
  minus:"M5 12h14",
  pageTop:"M6 17l6-6 6 6 M6 11l6-6 6 6",
  pageBot:"M6 7l6 6 6-6 M6 13l6 6 6-6",
  pencil:"M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7 M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  move:"M5 9l-2 2 2 2 M19 9l2 2-2 2 M9 5l2-2 2 2 M9 19l2 2 2-2 M12 3v18 M3 12h18",
  alignL:"M3 6h18 M3 11h13 M3 16h9",
  alignC:"M3 6h18 M6 11h12 M7 16h10",
  alignR:"M3 6h18 M8 11h13 M12 16h9",
  rotateCW:"M21 12a9 9 0 01-15.8 6M3 12a9 9 0 0115.8-6 M18 3l3 3-3 3",
};

function Icon({name, size=18, color, stroke=1.5, style={}}) {
  const d = PATHS[name];
  if (!d) return null;
  const segs = d.split(' M').map((s,i) => i===0 ? s : 'M'+s);
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color||"currentColor"} strokeWidth={stroke}
      strokeLinecap="round" strokeLinejoin="round"
      style={{flexShrink:0,...style}} aria-hidden="true">
      {segs.map((p,i) => <path key={i} d={p}/>)}
    </svg>
  );
}

const USERS = [
  {id:'u1',name:'Sandro Caron',initials:'SC',role:'admin',hasSig:true,team:'ABRANE FR'},
  {id:'u2',name:'Élise Mercier',initials:'ÉM',role:'editor',hasSig:true,team:'ABRANE FR'},
  {id:'u3',name:'Marco Bianchi',initials:'MB',role:'editor',hasSig:false,team:'ABRANE IT'},
  {id:'u4',name:'Camille Rouvière',initials:'CR',role:'viewer',hasSig:true,team:'ABRANE FR'},
];
const TEAM_TEMPLATES = [
  {id:'t-std',name:'ABRANE — Standard',kind:'generic',desc:'Modèle de base ABRANE. Couleurs crème + or.',palette:['#E8DCC8','#C8A96E','#2B2B2B'],pageFormat:'h-full',badges:['Officiel'],author:'Sandro Caron',updated:'Il y a 3 j',uses:28,lastAdminNote:null},
  {id:'t-san',name:'SANDRO Group',kind:'client',desc:'Identité SANDRO complète.',palette:['#E8DCC8','#C8A96E','#2B2B2B'],pageFormat:'h-full',badges:['Client','Mat.'],author:'Sandro Caron',updated:'Il y a 3 j',uses:12,lastAdminNote:null},
  {id:'t-lux',name:'LUXOR',kind:'client',desc:'Marine luxe profond + finitions or.',palette:['#22344F','#B89556','#0F1820'],pageFormat:'h-full',badges:['Client','Luxe'],author:'Élise Mercier',updated:'Hier',uses:4,lastAdminNote:{author:'Sandro Caron',date:'Hier',text:'Palette ajustée.'}},
  {id:'t-at7',name:'Atelier 7',kind:'client',desc:'Reliure premium, palette terre.',palette:['#F0EBE0','#8B6F47','#2B2B2B'],pageFormat:'h-ring',badges:['Client','Reliure'],author:'Sandro Caron',updated:'Il y a 2 sem',uses:3,lastAdminNote:null},
  {id:'t-car',name:'Maison Caron',kind:'client',desc:'Format vertical, palette claire.',palette:['#FBF5E8','#1B2E5C','#1A1F2E'],pageFormat:'v-full',badges:['Client','Vertical'],author:'Camille Rouvière',updated:'Il y a 1 sem',uses:2,lastAdminNote:null},
];
const MY_PROJECTS = [
  {id:'p1',name:'SANDRO — Collection Hiver',client:'SANDRO',subtitle:'Détails — Coll. AH26',pages:32,files:18,pageFormat:'h-full',palette:['#E8DCC8','#C8A96E','#2B2B2B'],updated:"Aujourd'hui",createdAt:'12/01/2026',rev:'REV 03',basedOn:'ABRANE — Standard',templateUpdateAvailable:false},
  {id:'p2',name:'LUXOR — Book Commercial',client:'LUXOR',subtitle:'Catalogue 2026',pages:24,files:11,pageFormat:'h-full',palette:['#22344F','#B89556','#0F1820'],updated:'Hier',createdAt:'05/03/2026',rev:'REV 01',basedOn:'Luxe Marine',templateUpdateAvailable:true,templateUpdateNote:'Palette ajustée.',templateUpdateAuthor:'Sandro Caron',templateUpdateDate:'Hier'},
  {id:'p3',name:'ATELIER 7 — Reliure',client:'Atelier 7',subtitle:'Showroom',pages:48,files:28,pageFormat:'h-ring',palette:['#F0EBE0','#8B6F47','#2B2B2B'],updated:'Lundi',createdAt:'18/02/2026',rev:'REV 02',basedOn:'Reliure Atelier',templateUpdateAvailable:false},
  {id:'p4',name:'Maison Caron — Devis Visuel',client:'Maison Caron',subtitle:'REV 02',pages:12,files:6,pageFormat:'v-full',palette:['#FBF5E8','#1B2E5C','#1A1F2E'],updated:'Il y a 1 sem',createdAt:'02/04/2026',rev:'REV 02',basedOn:'Fiche Produit V',templateUpdateAvailable:false},
];
const PALETTE_PRESETS = [
  {id:'pp1',c:['#E8DCC8','#C8A96E','#2B2B2B'],name:'Crème & Or'},
  {id:'pp2',c:['#22344F','#B89556','#0F1820'],name:'Marine Luxe'},
  {id:'pp3',c:['#FFFFFF','#888888','#1A1A1A'],name:'Monochrome'},
  {id:'pp4',c:['#F5EFE3','#8B6F47','#2B2B2B'],name:'Terre'},
  {id:'pp5',c:['#EAEFE2','#6A7F4F','#1F2A1A'],name:'Sauge'},
  {id:'pp6',c:['#F8EDE3','#9C2B2B','#2B1818'],name:'Bordeaux'},
];
const SAMPLE_FILES = [
  {id:'f1',name:'Coupe Detail 01.pdf',type:'pdf',pages:4,size:'2.1 Mo'},
  {id:'f2',name:'Coupe Detail 02.pdf',type:'pdf',pages:6,size:'3.4 Mo'},
  {id:'f3',name:'Vue Eclatee Module A.png',type:'png',pages:1,size:'840 Ko'},
  {id:'f4',name:'Plan Assemblage.pdf',type:'pdf',pages:2,size:'1.2 Mo'},
  {id:'f5',name:'Galerie Photos 01.pdf',type:'pdf',pages:12,size:'8.7 Mo'},
  {id:'f6',name:'Echantillons.jpg',type:'jpg',pages:1,size:'620 Ko'},
];
const SAMPLE_MATS = [
  {mat:'Chêne massif',fin:'Huilé naturel',imgUrl:''},{mat:'Laiton brossé',fin:'PVD or',imgUrl:''},
  {mat:'Cuir pleine fl.',fin:'Cognac',imgUrl:''},{mat:'Marbre Calacatta',fin:'Adouci',imgUrl:''},
  {mat:'Verre fumé',fin:'Bronze',imgUrl:''},{mat:'Lin tissé',fin:'Naturel',imgUrl:''},
  {mat:'Velours côtelé',fin:'Bleu nuit',imgUrl:''},{mat:'Acier corten',fin:'Patiné',imgUrl:''},
  {mat:'Pierre noire',fin:'Flammée',imgUrl:''},{mat:'Frêne thermo',fin:'Mat',imgUrl:''},
  {mat:'Bronze',fin:'Poli miroir',imgUrl:''},{mat:'Cuivre',fin:'Vert-de-gris',imgUrl:''},
];
const PAGE_FORMATS = [
  {id:'h-full',group:'h',name:'Horizontal — Pleine page',desc:'Image plein cadre.',icon:'page'},
  {id:'h-ring',group:'h',name:'Horizontal — Reliure',desc:'Marge gauche élargie.',icon:'ring'},
  {id:'h-notes',group:'h',name:'Horizontal — Notes',desc:'Image + zone notes.',icon:'notes'},
  {id:'v-full',group:'v',name:'Vertical — Pleine page',desc:'Portrait A4 standard.',icon:'pageVert'},
  {id:'v-ring',group:'v',name:'Vertical — Reliure',desc:'Portrait avec reliure.',icon:'ring'},
  {id:'v-notes',group:'v',name:'Vertical — Notes',desc:'Portrait + zone notes.',icon:'notes'},
];
const STEPS = [
  {id:'project',label:'Projet',sub:'Client, logo',icon:'folder',group:'Configurateur'},
  {id:'palette',label:'Palette',sub:'3 couleurs',icon:'palette',group:'Configurateur'},
  {id:'format',label:'Format de page',sub:'Paysage / Portrait',icon:'layers',group:'Configurateur'},
  {id:'cover',label:'Couverture',sub:'Titres, photo',icon:'cover',group:'Mise en page'},
  {id:'index',label:'Index',sub:'Sommaire auto',icon:'index',group:'Mise en page'},
  {id:'mat',label:'Matériaux',sub:'Grille de vignettes',icon:'swatch',group:'Mise en page'},
  {id:'notes',label:'Notes',sub:'Pages annotables',icon:'notes',group:'Mise en page'},
  {id:'content',label:'Contenu',sub:'PDF, images',icon:'doc',group:'Contenu'},
  {id:'back',label:'Page finale',sub:'Coordonnées',icon:'fileText',group:'Contenu'},
  {id:'sign',label:'Signature',sub:'Filigrane',icon:'signature',group:'Finition'},
  {id:'sym',label:'Symboles',sub:'Icônes flottantes',icon:'sparkle',group:'Finition'},
];
const STEP_GROUPS = ['Configurateur','Mise en page','Contenu','Finition'];

const initialsFrom = n => !n?'?':n.trim().split(/\s+/).map(w=>w[0]).filter(Boolean).slice(0,2).join('').toUpperCase();
const paletteHash = n => { let h=0; for(let i=0;i<(n||'').length;i++) h=(h*31+n.charCodeAt(i))|0; return `hsl(${Math.abs(h)%360},35%,30%)`; };
const shade = (hex,amt) => { try { const n=parseInt(hex.replace('#',''),16); let r=(n>>16)+amt,g=(n>>8&255)+amt,b=(n&255)+amt; return '#'+(Math.max(0,Math.min(255,r))<<16|Math.max(0,Math.min(255,g))<<8|Math.max(0,Math.min(255,b))).toString(16).padStart(6,'0'); } catch { return hex; } };

const readFileAsDataUrl = file => new Promise((res,rej)=>{const r=new FileReader();r.onload=e=>res(e.target.result);r.onerror=rej;r.readAsDataURL(file);});

const renderPdfToDataUrls = async file => {
  const pdfjsLib = window.pdfjsLib;
  if(!pdfjsLib) return {pageCount:1,pageUrls:[]};
  const ab = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({data:ab}).promise;
  const pageCount = pdf.numPages;
  const pageUrls = [];
  for(let i=1;i<=pageCount;i++){
    const page = await pdf.getPage(i);
    const vp = page.getViewport({scale:1.5});
    const canvas = document.createElement('canvas');
    canvas.width = vp.width; canvas.height = vp.height;
    await page.render({canvasContext:canvas.getContext('2d'),viewport:vp}).promise;
    pageUrls.push(canvas.toDataURL('image/jpeg',0.85));
  }
  return {pageCount,pageUrls};
};

const initialState = project => {
  const t=new Date(), dd=String(t.getDate()).padStart(2,'0'), mm=String(t.getMonth()+1).padStart(2,'0');
  return {
    name:project?.name||'Nouveau projet', client:project?.client||'SANDRO',
    subtitle:project?.subtitle||'Détails', year:'2026', rev:'REV 01',
    projectDate:`${dd}/${mm}/${t.getFullYear()}`, mainTitle:project?.mainTitle||'BOOK',
    pageFormat:project?.pageFormat||'h-full',
    palette:{c1:project?.palette?.[0]||'#E8DCC8',c2:project?.palette?.[1]||'#C8A96E',c3:project?.palette?.[2]||'#2B2B2B'},
    logoScale:100, clientLogoUrl:'',
    showQuoteRef:false,quoteRef:'',showInternalRef:false,internalRef:'',
    showContact:false,contact:'',showSendDate:false,sendDate:'',showProjectType:false,projectType:'',
    tags:[],
    enIdx:true,enMat:true,enNotes:false,idxMode:'all',thumbCount:12,
    materials:SAMPLE_MATS, files:[], contentOrder:[],
    backLines:['ABRANE France S.A.S','7 rue du Pont à Lunettes','69390 Vourles','Tél: +33(0)4.78.95.96.20'],
    backDecor:'BOOK', sigEnabled:false, wmEnabled:false, wmOpacity:15,
    bgImageUrl:'', bgX:50, bgY:50, bgScale:100,
    notes:[''],enNotes:false, noteContent:'', noteHtml:'', annotations:{}, annotSnaps:{}, pageNotes:{}, _dirty:false,
  };
};

const computeCompletion = (s, dirty={}) => ({
  project:dirty.project&&s.client?.length>0?'done':'',palette:dirty.palette?'done':'',
  format:dirty.format?'done':'',cover:dirty.cover&&s.mainTitle?.length>0?'done':'',
  index:dirty.index&&s.enIdx?'done':'',mat:dirty.mat&&s.enMat?'done':'',
  notes:dirty.notes&&s.enNotes?'done':'',content:dirty.content&&s.files.length>0?'done':'',
  back:dirty.back&&s.backLines.some(l=>l)?'done':'',sign:dirty.sign&&s.sigEnabled?'done':'',sym:'',
});

const inputSt = {width:'100%',padding:'7px 10px',background:T.surface,border:`1px solid ${T.line}`,borderRadius:6,fontSize:12.5,color:T.ink,fontFamily:'inherit',outline:'none',boxSizing:'border-box'};
const pillSt = (v='default') => ({display:'inline-flex',alignItems:'center',gap:5,padding:'2px 8px',borderRadius:999,fontSize:10.5,fontWeight:500,background:v==='gold'?T.goldTint:v==='navy'?T.navyTint:T.panel2,color:v==='gold'?T.navy:v==='navy'?T.navy:T.ink2,border:`1px solid ${v==='gold'?T.goldSoft:v==='navy'?'#D2DBEC':T.lineSoft}`});
const btnSt = (v='default',sm=false) => ({display:'inline-flex',alignItems:'center',gap:6,border:`1px solid ${v==='primary'?T.navy:v==='gold'?T.goldSoft:T.line}`,background:v==='primary'?T.navy:v==='gold'?T.goldTint:v==='ghost'?'transparent':T.surface,color:v==='primary'?'#fff':v==='gold'?T.navy:T.ink,fontSize:sm?11.5:12.5,fontWeight:500,padding:sm?'5px 9px':'7px 12px',borderRadius:6,cursor:'pointer',fontFamily:'inherit'});

function MiniCover({palette,client,subtitle}) {
  const [c1,c2,c3]=palette;
  return <div style={{position:'absolute',inset:0,background:c1,display:'grid',gridTemplateColumns:'1fr 12%'}}>
    <div style={{padding:'12% 8% 10% 10%',display:'flex',flexDirection:'column',justifyContent:'space-between'}}>
      <div style={{display:'flex',gap:8,alignItems:'center'}}>
        <div style={{width:22,height:22,borderRadius:4,background:paletteHash(client||'A'),color:'#fff',display:'grid',placeItems:'center',fontSize:9,fontWeight:700}}>{initialsFrom(client||'A')}</div>
        <div style={{fontSize:8,letterSpacing:'.15em',color:c3,opacity:.6}}>BOOK</div>
      </div>
      <div>
        <div style={{fontWeight:900,color:c3,fontSize:16,lineHeight:.9}}>{(client||'').toUpperCase()}</div>
        <div style={{fontSize:8,color:c3,opacity:.6,marginTop:4}}>{subtitle||''}</div>
      </div>
    </div>
    <div style={{background:c2}}/>
  </div>;
}

function LoginScreen({onLogin}) {
  const [newName,setNewName]=useState('');
  const doCreate=()=>{if(!newName.trim())return;onLogin({id:'new',name:newName.trim(),initials:newName.trim().split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase(),role:'editor',hasSig:false,team:'ABRANE FR'});};
  return <div style={{position:'fixed',inset:0,display:'grid',placeItems:'center',background:T.bg,zIndex:100}}>
    <div style={{width:420,maxWidth:'92vw',background:T.surface,borderRadius:22,padding:'36px 36px 24px',boxShadow:'0 24px 80px rgba(15,20,40,.22)',border:`1px solid ${T.line}`}}>
      <div style={{display:'flex',justifyContent:'center',marginBottom:20}}>
        <div style={{background:T.navy,borderRadius:6,padding:'10px 24px',display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
          <span style={{color:'#fff',fontWeight:900,fontSize:18,letterSpacing:3}}>ABRANE</span>
          <span style={{color:'rgba(255,255,255,.5)',fontSize:8,letterSpacing:2}}>LE FABRICANT DE MOBILIER TEST</span>
        </div>
      </div>
      <h1 style={{fontSize:20,fontWeight:600,textAlign:'center',color:T.ink,margin:'0 0 6px'}}>Bienvenue</h1>
      <p style={{fontSize:12.5,color:T.ink3,textAlign:'center',margin:'0 0 20px'}}>Sélectionnez votre profil pour continuer.</p>
      <div style={{display:'flex',flexDirection:'column',gap:6,marginBottom:16}}>
        {USERS.map(u=><button key={u.id} onClick={()=>onLogin(u)} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 12px',borderRadius:8,border:`1px solid ${T.lineSoft}`,background:T.surface,cursor:'pointer',width:'100%',textAlign:'left'}}>
          <div style={{width:32,height:32,borderRadius:'50%',background:T.navy,color:'#fff',display:'grid',placeItems:'center',fontWeight:600,fontSize:11,flexShrink:0}}>{u.initials}</div>
          <div style={{flex:1}}><div style={{fontSize:13,fontWeight:500,color:T.ink}}>{u.name}</div><div style={{fontSize:11,color:T.ink3}}>{u.team} · {u.hasSig?'Signature enregistrée':'Pas de signature'}</div></div>
          <span style={pillSt(u.role==='admin'?'gold':'default')}>{u.role==='admin'?'Admin':u.role==='editor'?'Éditeur':'Lecture'}</span>
        </button>)}
      </div>
      <div style={{borderTop:`1px solid ${T.lineSoft}`,paddingTop:14,display:'flex',gap:8}}>
        <input style={inputSt} placeholder="Créer un nouveau profil…" value={newName} onChange={e=>setNewName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&doCreate()}/>
        <button style={{...btnSt('primary',true),whiteSpace:'nowrap'}} onClick={doCreate}><Icon name="plus" size={12} color="#fff"/>Créer</button>
      </div>
    </div>
  </div>;
}

function Dashboard({user,onOpenProject,onNewProject,onOpenTemplate}) {
  const [tab,setTab]=useState('projects');
  const [q,setQ]=useState('');
  const [viewMode,setViewMode]=useState('grid');
  const [sort,setSort]=useState('recent');
  const [tplKind,setTplKind]=useState('all');
  const [applyModal,setApplyModal]=useState(null);
  const [updateModal,setUpdateModal]=useState(null);
  const projects=MY_PROJECTS.filter(p=>!q||p.name.toLowerCase().includes(q.toLowerCase())||p.client.toLowerCase().includes(q.toLowerCase()));
  const templates=TEAM_TEMPLATES.filter(t=>(tplKind==='all'||t.kind===tplKind)&&(!q||t.name.toLowerCase().includes(q.toLowerCase())));
  return <div style={{flex:1,overflowY:'auto',background:T.bg}}>
    <div style={{maxWidth:1100,margin:'0 auto',padding:'32px 36px 80px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',gap:24,marginBottom:26}}>
        <div>
          <h1 style={{fontSize:26,fontWeight:600,color:T.ink,margin:0}}>Bonjour {user.name.split(' ')[0]}.</h1>
          <p style={{fontSize:13.5,color:T.ink3,marginTop:4,marginBottom:0}}>Reprenez un projet ou démarrez depuis un modèle client.</p>
        </div>
        <button style={{...btnSt('primary'),padding:'10px 16px',fontSize:13.5,borderRadius:8}} onClick={onNewProject}><Icon name="plus" size={14} color="#fff"/>Nouveau projet</button>
      </div>
      <div style={{display:'inline-flex',gap:2,padding:3,background:T.panel2,borderRadius:8,border:`1px solid ${T.lineSoft}`,marginBottom:16}}>
        {[{id:'projects',icon:'folder',label:'Mes projets',cnt:MY_PROJECTS.length},{id:'templates',icon:'folderTeam',label:'Modèles Clients',cnt:TEAM_TEMPLATES.length},{id:'shared',icon:'share',label:'Partagés avec moi',cnt:0}].map(tb=>(
          <button key={tb.id} onClick={()=>setTab(tb.id)} style={{display:'inline-flex',alignItems:'center',gap:7,padding:'6px 14px',borderRadius:7,fontSize:12.5,fontWeight:500,color:tab===tb.id?T.ink:T.ink2,border:'none',background:tab===tb.id?'#fff':'transparent',cursor:'pointer',boxShadow:tab===tb.id?'0 1px 2px rgba(0,0,0,.05)':'none'}}>
            <Icon name={tb.icon} size={14} color={tab===tb.id?T.ink:T.ink3}/>{tb.label}
            <span style={{fontSize:10,padding:'1px 6px',borderRadius:999,background:tab===tb.id?T.navyTint:T.panel2,color:tab===tb.id?T.navy:T.ink3}}>{tb.cnt}</span>
          </button>
        ))}
      </div>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20}}>
        <div style={{position:'relative',flex:'0 0 300px'}}>
          <Icon name="search" size={14} color={T.ink4} style={{position:'absolute',left:9,top:'50%',transform:'translateY(-50%)'}}/>
          <input style={{...inputSt,paddingLeft:32}} placeholder="Rechercher…" value={q} onChange={e=>setQ(e.target.value)}/>
        </div>
        {tab==='projects'&&<div style={{display:'inline-flex',padding:2,background:T.panel2,borderRadius:6,border:`1px solid ${T.lineSoft}`}}>
          {[['recent','Récents'],['name','A–Z'],['client','Client']].map(([k,l])=><button key={k} onClick={()=>setSort(k)} style={{border:'none',background:sort===k?'#fff':'transparent',color:sort===k?T.ink:T.ink2,padding:'4px 10px',fontSize:11.5,borderRadius:5,cursor:'pointer',fontWeight:500}}>{l}</button>)}
        </div>}
        {tab==='templates'&&<div style={{display:'inline-flex',padding:2,background:T.panel2,borderRadius:6,border:`1px solid ${T.lineSoft}`}}>
          {[['all','Tous'],['generic','Génériques'],['client','Clients']].map(([k,l])=><button key={k} onClick={()=>setTplKind(k)} style={{border:'none',background:tplKind===k?'#fff':'transparent',color:tplKind===k?T.ink:T.ink2,padding:'4px 11px',fontSize:11.5,borderRadius:5,cursor:'pointer',fontWeight:500}}>{l}</button>)}
        </div>}
        <div style={{flex:1}}/>
        {tab==='projects'&&<div style={{display:'inline-flex',padding:2,background:T.panel2,borderRadius:6,border:`1px solid ${T.lineSoft}`}}>
          {[['grid','grid'],['list','index']].map(([k,ico])=><button key={k} onClick={()=>setViewMode(k)} style={{border:'none',background:viewMode===k?'#fff':'transparent',padding:'5px 8px',borderRadius:5,cursor:'pointer',display:'flex',alignItems:'center'}}><Icon name={ico} size={14} color={viewMode===k?T.navy:T.ink3}/></button>)}
        </div>}
      </div>
      {tab==='projects'&&viewMode==='grid'&&<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:16}}>
        <button onClick={onNewProject} style={{minHeight:200,border:`1.5px dashed ${T.lineStrong}`,borderRadius:12,background:'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8,flexDirection:'column',color:T.ink2}}>
          <Icon name="plus" size={22} color={T.ink3}/><div><div style={{fontWeight:600,fontSize:13}}>Nouveau projet</div><div style={{fontSize:11,color:T.ink3,marginTop:2}}>Vierge ou depuis un modèle</div></div>
        </button>
        {projects.map(p=><div key={p.id} style={{background:T.surface,border:`1px solid ${T.line}`,borderRadius:12,overflow:'hidden',cursor:'pointer'}} onClick={()=>onOpenProject(p)}>
          <div style={{aspectRatio:'297/210',background:T.panel,borderBottom:`1px solid ${T.lineSoft}`,position:'relative',overflow:'hidden'}}>
            <MiniCover palette={p.palette} client={p.client} subtitle={p.subtitle}/>
            {p.templateUpdateAvailable&&<button style={{position:'absolute',top:10,right:10,display:'inline-flex',alignItems:'center',gap:5,background:T.gold,color:'#1A1F2E',border:'none',padding:'4px 10px',borderRadius:999,fontSize:10.5,fontWeight:600,cursor:'pointer',zIndex:2}} onClick={e=>{e.stopPropagation();setUpdateModal(p);}}><Icon name="sparkle" size={12} color="#1A1F2E"/>Mise à jour</button>}
          </div>
          <div style={{padding:'12px 14px'}}>
            <div style={{fontSize:13,fontWeight:600,color:T.ink}}>{p.name}</div>
            <div style={{fontSize:11,color:T.ink3,marginTop:3,display:'flex',gap:6,flexWrap:'wrap'}}><span>{p.client}</span><span>·</span><span>{p.pages} pages</span><span>·</span><span style={{fontWeight:500,color:T.ink2}}>{p.rev}</span></div>
            <div style={{fontSize:10.5,color:T.ink4,marginTop:2,display:'flex',gap:4,alignItems:'center'}}><Icon name="history" size={11} color={T.ink4}/>{p.updated} · Créé {p.createdAt}</div>
            <div style={{display:'flex',gap:6,marginTop:8,flexWrap:'wrap'}}>
              <span style={pillSt()}><Icon name={p.pageFormat.startsWith('h')?'page':'pageVert'} size={11} color={T.ink2}/>{p.pageFormat.startsWith('h')?'Paysage':'Portrait'}</span>
              <span style={pillSt('gold')}><Icon name="layers" size={11} color={T.navy}/>{p.basedOn}</span>
            </div>
          </div>
        </div>)}
      </div>}
      {tab==='projects'&&viewMode==='list'&&<div style={{background:T.surface,border:`1px solid ${T.line}`,borderRadius:12,overflow:'hidden'}}>
        <div style={{display:'grid',gridTemplateColumns:'40px 1fr 120px 80px 80px 100px',gap:12,padding:'8px 14px',background:T.panel,borderBottom:`1px solid ${T.line}`,fontSize:10.5,fontWeight:600,color:T.ink4,textTransform:'uppercase',letterSpacing:'.06em'}}>
          <div/><div>Nom</div><div>Client</div><div>Révision</div><div>Pages</div><div>Modifié</div>
        </div>
        {projects.map((p,i)=><div key={p.id} onClick={()=>onOpenProject(p)} style={{display:'grid',gridTemplateColumns:'40px 1fr 120px 80px 80px 100px',gap:12,padding:'10px 14px',borderBottom:i<projects.length-1?`1px solid ${T.lineSoft}`:'none',cursor:'pointer',alignItems:'center',background:T.surface}} onMouseEnter={e=>e.currentTarget.style.background=T.tint} onMouseLeave={e=>e.currentTarget.style.background=T.surface}>
          <div style={{width:32,height:32,borderRadius:6,display:'grid',gridTemplateColumns:'1fr 30%',overflow:'hidden',border:`1px solid ${T.line}`}}><div style={{background:p.palette[0]}}/><div style={{background:p.palette[1]}}/></div>
          <div><div style={{fontSize:13,fontWeight:600,color:T.ink}}>{p.name}</div><div style={{fontSize:10.5,color:T.ink4}}>Créé {p.createdAt}</div></div>
          <div style={{fontSize:12,color:T.ink2}}>{p.client}</div>
          <span style={{...pillSt('navy'),fontSize:10}}>{p.rev}</span>
          <div style={{fontSize:12,color:T.ink2}}>{p.pages} p.</div>
          <div style={{fontSize:11.5,color:T.ink3}}>{p.updated}</div>
        </div>)}
      </div>}
      {tab==='templates'&&(()=>{
        const generics=templates.filter(t=>t.kind==='generic');
        const clients=templates.filter(t=>t.kind==='client');
        return <div style={{display:'flex',flexDirection:'column',gap:32}}>
          {generics.length>0&&<div>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:14}}>
              <div style={{width:36,height:36,borderRadius:8,background:T.navy,display:'grid',placeItems:'center',flexShrink:0}}><Icon name="layers" size={18} color="#fff"/></div>
              <div><div style={{fontSize:14,fontWeight:700,color:T.ink}}>Modèle standard ABRANE</div><div style={{fontSize:11.5,color:T.ink3}}>Base officielle validée par l'admin</div></div>
            </div>
            {generics.map(t=><button key={t.id} onClick={()=>setApplyModal(t)} style={{width:'100%',display:'grid',gridTemplateColumns:'180px 1fr auto',background:T.surface,border:`2px solid ${T.navy}`,borderRadius:12,overflow:'hidden',cursor:'pointer',textAlign:'left',padding:0,boxShadow:`0 0 0 4px ${T.navyTint}`}}>
              <div style={{aspectRatio:'297/210',background:T.panel,position:'relative',overflow:'hidden',borderRight:`1px solid ${T.line}`}}>
                <MiniCover palette={t.palette} client="ABRANE" subtitle="MODÈLE STANDARD"/>
                <div style={{position:'absolute',top:8,left:8,background:T.navy,color:'#fff',fontSize:9,fontWeight:700,letterSpacing:'.1em',padding:'2px 7px',borderRadius:4}}>OFFICIEL</div>
              </div>
              <div style={{padding:'18px 22px',display:'flex',flexDirection:'column',justifyContent:'center',gap:6}}>
                <div style={{fontSize:16,fontWeight:700,color:T.ink}}>{t.name}</div>
                <div style={{fontSize:12.5,color:T.ink3,lineHeight:1.5}}>{t.desc}</div>
                <div style={{fontSize:11,color:T.ink4}}>{t.uses} utilisations · {t.updated}</div>
              </div>
              <div style={{padding:'18px 20px',display:'flex',alignItems:'center',borderLeft:`1px solid ${T.line}`,background:T.navyTint}}>
                <div style={{...btnSt('primary'),justifyContent:'center'}}><Icon name="plus" size={13} color="#fff"/>Utiliser</div>
              </div>
            </button>)}
          </div>}
          {clients.length>0&&<div>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:14}}>
              <div style={{width:36,height:36,borderRadius:8,background:T.gold,display:'grid',placeItems:'center',flexShrink:0}}><Icon name="users" size={18} color="#fff"/></div>
              <div><div style={{fontSize:14,fontWeight:700,color:T.ink}}>Modèles clients</div><div style={{fontSize:11.5,color:T.ink3}}>Logo, palette, matériaux pré-chargés</div></div>
              {user.role==='admin'&&<button style={{...btnSt(undefined,true),marginLeft:'auto'}}><Icon name="plus" size={12} color={T.ink3}/>Ajouter</button>}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:12}}>
              {clients.map(t=><button key={t.id} onClick={()=>setApplyModal(t)} style={{background:T.surface,border:`1px solid ${T.goldSoft}`,borderRadius:10,overflow:'hidden',cursor:'pointer',textAlign:'left',padding:0}}>
                <div style={{height:6,background:`linear-gradient(90deg,${t.palette[0]},${t.palette[1]},${t.palette[2]})`}}/>
                <div style={{aspectRatio:'297/210',background:T.panel,position:'relative',overflow:'hidden',borderBottom:`1px solid ${T.lineSoft}`}}>
                  <MiniCover palette={t.palette} client={t.name} subtitle="MODÈLE CLIENT"/>
                  {t.lastAdminNote&&<div style={{position:'absolute',top:6,right:6,background:T.gold,color:'#1A1F2E',padding:'2px 7px',borderRadius:999,fontSize:9,fontWeight:700}}>MÀJ</div>}
                </div>
                <div style={{padding:'10px 12px'}}>
                  <div style={{fontSize:12.5,fontWeight:700,color:T.ink,marginBottom:2}}>{t.name}</div>
                  <div style={{fontSize:10.5,color:T.ink3,lineHeight:1.4,marginBottom:8}}>{t.desc}</div>
                  <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>{t.badges.map((b,i)=><span key={i} style={{...pillSt(i===0?'gold':'default'),fontSize:9.5,padding:'1px 6px'}}>{b}</span>)}</div>
                </div>
              </button>)}
            </div>
          </div>}
          <div style={{background:T.panel,border:`1px solid ${T.lineSoft}`,borderRadius:10,padding:'14px 18px',display:'flex',alignItems:'center',gap:14}}>
            <div style={{width:32,height:32,borderRadius:8,background:T.successT,display:'grid',placeItems:'center',flexShrink:0}}><Icon name="folder" size={16} color={T.success}/></div>
            <div style={{flex:1}}><div style={{fontSize:12.5,fontWeight:600,color:T.ink}}>Vos projets personnels</div><div style={{fontSize:11,color:T.ink3,marginTop:2}}>Retrouvez vos documents dans <strong style={{color:T.ink}}>Mes projets</strong>.</div></div>
            <button onClick={()=>setTab('projects')} style={btnSt(undefined,true)}><Icon name="folder" size={12} color={T.ink}/>Mes projets</button>
          </div>
        </div>;
      })()}
      {tab==='shared'&&<div style={{padding:'60px 40px',textAlign:'center',background:T.surface,border:`1px solid ${T.lineSoft}`,borderRadius:12}}>
        <Icon name="share" size={32} color={T.ink3} style={{margin:'0 auto 16px'}}/>
        <div style={{fontSize:15,fontWeight:600,color:T.ink,marginBottom:6}}>Aucun projet partagé</div>
        <div style={{color:T.ink3,fontSize:12.5}}>Lorsqu'un collègue partagera un projet, il apparaîtra ici.</div>
      </div>}
    </div>
    {applyModal&&<TemplateApplyModal template={applyModal} onClose={()=>setApplyModal(null)} onConfirm={opts=>{setApplyModal(null);onOpenTemplate({...applyModal,...opts});}}/>}
    {updateModal&&<TemplateUpdateModal project={updateModal} onClose={()=>setUpdateModal(null)} onDecision={()=>setUpdateModal(null)}/>}
  </div>;
}

function Scrim({onClose,children}) {
  return <div style={{position:'fixed',inset:0,background:'rgba(20,20,30,.42)',backdropFilter:'blur(6px)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={onClose}>{children}</div>;
}
function FormatThumb({id,accent='#C8A96E'}) {
  const isP=id.startsWith('v'),w=isP?80:100,h=isP?100:70,isR=id.includes('ring'),isN=id.includes('notes');
  return <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="100%" style={{display:'block'}}>
    <rect width={w} height={h} fill="#fff" stroke="#D9D1C0"/>
    <rect x={w-8} y={0} width={8} height={h} fill={accent} opacity=".3"/>
    {isR&&[0,1,2,3].map(i=><circle key={i} cx={5} cy={8+i*((h-16)/3)} r={1.6} fill="none" stroke="#D9D1C0"/>)}
    <rect x={isR?10:4} y={4} width={w-(isR?20:14)} height={isN?(h-4)*0.7-4:h-8} fill="#FAFAF7" stroke="#D9D1C0" strokeDasharray="2 2"/>
    {isN&&<rect x={isR?10:4} y={(h-4)*0.7+2} width={w-(isR?20:14)} height={h*0.25} fill="#fff" stroke="#D9D1C0"/>}
    <circle cx={w-4} cy={h/2} r={1.2} fill={accent}/>
  </svg>;
}
function TemplateApplyModal({template,onClose,onConfirm}) {
  const [name,setName]=useState(template.kind==='client'?`${template.name} — `:'Nouveau projet');
  const [fmt,setFmt]=useState(template.pageFormat);
  return <Scrim onClose={onClose}><div style={{width:520,maxWidth:'92vw',maxHeight:'85vh',background:T.surface,borderRadius:16,overflow:'hidden',boxShadow:'0 24px 80px rgba(15,20,40,.22)',display:'flex',flexDirection:'column'}} onClick={e=>e.stopPropagation()}>
    <div style={{padding:'18px 24px 14px',borderBottom:`1px solid ${T.lineSoft}`,display:'flex',justifyContent:'space-between',flexShrink:0}}>
      <div><div style={{fontSize:16,fontWeight:600,color:T.ink}}>Nouveau — {template.name}</div><div style={{fontSize:12,color:T.ink3,marginTop:3}}>{template.kind==='client'?'Tout est pré-rempli.':'Style et format sans identité client.'}</div></div>
      <button style={{...btnSt('ghost',true),padding:4,border:'none'}} onClick={onClose}><Icon name="close" size={16} color={T.ink3}/></button>
    </div>
    <div style={{padding:'14px 24px 18px',overflowY:'auto',flex:1}}>
      <div style={{display:'flex',flexDirection:'column',gap:5,marginBottom:12}}>
        <label style={{fontSize:11,color:T.ink3,fontWeight:500}}>Nom du projet</label>
        <input style={{...inputSt,padding:'9px 12px',fontSize:13}} value={name} onChange={e=>setName(e.target.value)} autoFocus/>
      </div>
      <div style={{fontSize:10.5,letterSpacing:'.12em',fontWeight:600,textTransform:'uppercase',color:T.ink4,marginBottom:8}}>Format</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
        {PAGE_FORMATS.map(f=><button key={f.id} onClick={()=>setFmt(f.id)} style={{padding:7,textAlign:'left',background:T.surface,border:`${f.id===fmt?2:1}px solid ${f.id===fmt?T.navy:T.line}`,borderRadius:8,cursor:'pointer'}}>
          <div style={{marginBottom:5,borderRadius:4,overflow:'hidden'}}><FormatThumb id={f.id} accent={template.palette[1]}/></div>
          <div style={{fontSize:11,fontWeight:500,color:T.ink}}>{f.name.replace(/^[^—]+— /,'')}</div>
        </button>)}
      </div>
    </div>
    <div style={{padding:'12px 24px',borderTop:`1px solid ${T.lineSoft}`,display:'flex',justifyContent:'flex-end',gap:8,background:T.panel,flexShrink:0}}>
      <button style={btnSt()} onClick={onClose}>Annuler</button>
      <button style={btnSt('primary')} onClick={()=>onConfirm({name,pageFormat:fmt})}><Icon name="check" size={14} color="#fff"/>Créer</button>
    </div>
  </div></Scrim>;
}
function TemplateUpdateModal({project,onClose,onDecision}) {
  return <Scrim onClose={onClose}><div style={{width:500,maxWidth:'92vw',background:T.surface,borderRadius:16,overflow:'hidden'}} onClick={e=>e.stopPropagation()}>
    <div style={{padding:'22px 28px 16px',borderBottom:`1px solid ${T.lineSoft}`,display:'flex',justifyContent:'space-between'}}>
      <div><div style={{fontSize:17,fontWeight:600,color:T.ink}}>Modèle mis à jour</div><div style={{fontSize:12,color:T.ink3,marginTop:3}}>Le modèle « {project.basedOn} » a été modifié.</div></div>
      <button style={{...btnSt('ghost',true),padding:4,border:'none'}} onClick={onClose}><Icon name="close" size={16} color={T.ink3}/></button>
    </div>
    <div style={{padding:'16px 28px 24px',display:'flex',flexDirection:'column',gap:8}}>
      <div style={{padding:'12px 14px',background:T.panel,border:`1px solid ${T.line}`,borderRadius:8,fontSize:12.5,color:T.ink}}>{project.templateUpdateNote}</div>
      {[{id:'adopt',icon:'refresh',label:'Adopter la nouvelle version',desc:'Vos fichiers sont conservés.'},{id:'keep',icon:'lock',label:'Conserver ma version',desc:"Reste sur l'ancien modèle."}].map(o=><button key={o.id} onClick={()=>onDecision(o.id)} style={{display:'flex',alignItems:'flex-start',gap:12,padding:'12px 14px',background:T.surface,border:`1px solid ${T.line}`,borderRadius:8,cursor:'pointer',textAlign:'left'}}>
        <div style={{width:32,height:32,borderRadius:8,flexShrink:0,background:T.navyTint,display:'grid',placeItems:'center'}}><Icon name={o.icon} size={16} color={T.navy}/></div>
        <div><div style={{fontWeight:600,fontSize:13,color:T.ink}}>{o.label}</div><div style={{fontSize:11,color:T.ink3,marginTop:2}}>{o.desc}</div></div>
      </button>)}
    </div>
  </div></Scrim>;
}

// ── PAGE COMPONENTS ───────────────────────────────────────
function BindingMarks({isRing}) {
  if(!isRing) return null;
  return <div style={{position:'absolute',top:'4%',bottom:'4%',left:'1.8%',width:'4.5%',display:'flex',flexDirection:'column',justifyContent:'space-between',alignItems:'center',zIndex:6,pointerEvents:'none'}}>
    {Array.from({length:20}).map((_,i)=><div key={i} style={{width:'100%',height:'0.9%',background:'#fff',border:'1px solid rgba(0,0,0,.18)',borderRadius:1.5}}/>)}
  </div>;
}

function CoverPage({state,isPortrait,isRing}) {
  const p=state.palette;
  const bits=[];
  if(state.showQuoteRef&&state.quoteRef) bits.push({k:'Devis',v:state.quoteRef});
  if(state.showInternalRef&&state.internalRef) bits.push({k:'Réf.',v:state.internalRef});
  if(state.showContact&&state.contact) bits.push({k:'Contact',v:state.contact});
  if(state.showSendDate&&state.sendDate) bits.push({k:'Envoi',v:state.sendDate});
  if(state.showProjectType&&state.projectType) bits.push({k:'Type',v:state.projectType});
  return <div style={{width:'100%',aspectRatio:isPortrait?'210/297':'297/210',background:'#fff',display:'grid',gridTemplateColumns:'1fr 8%',position:'relative',overflow:'hidden'}}>
    <div style={{padding:'6% 5% 5% '+(isRing?'12%':'5%'),display:'flex',flexDirection:'column',justifyContent:'space-between',position:'relative'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',position:'relative',zIndex:3,height:'20%',flexShrink:0,overflow:'hidden'}}>
        {state.clientLogoUrl
          ?<img src={state.clientLogoUrl} alt={state.client} style={{height:`${state.logoScale}%`,maxHeight:'100%',maxWidth:'55%',objectFit:'contain',display:'block'}}/>
          :<div style={{width:16}}/>
        }
        <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:2,flexShrink:0}}>
          <div style={{background:T.navy,borderRadius:3,padding:'3px 8px'}}><span style={{color:'#fff',fontWeight:900,fontSize:9,letterSpacing:2}}>ABRANE</span></div>
          <span style={{fontSize:7,color:T.ink4,letterSpacing:'.08em'}}>LE FABRICANT DE MOBILIER</span>
        </div>
      </div>
      <div style={{position:'absolute',top:'26%',left:isRing?'12%':'0',right:'0',height:'44%',zIndex:1,overflow:'hidden'}}>
        {state.bgImageUrl
          ?<img src={state.bgImageUrl} alt="" style={{position:'absolute',width:`${state.bgScale}%`,height:`${state.bgScale}%`,objectFit:'cover',opacity:.20,left:`${state.bgX}%`,top:`${state.bgY}%`,transform:'translate(-50%,-50%)',maxWidth:'none'}}/>
          :<div style={{width:'100%',height:'100%',background:`repeating-linear-gradient(135deg,${p.c1} 0 14px,${shade(p.c1,-6)} 14px 28px)`,opacity:.6}}/>
        }
      </div>
      <div style={{position:'relative',zIndex:2,marginTop:'auto'}}>
        <div style={{fontSize:11,letterSpacing:'.28em',color:shade(p.c3,40),fontWeight:500,marginBottom:4}}>{state.year}</div>
        <div style={{fontSize:`clamp(18px,${Math.max(2.5,5.5-Math.max(0,state.mainTitle.length-10)*0.3)}vw,72px)`,fontWeight:900,letterSpacing:'-.02em',lineHeight:.88,color:p.c3,wordBreak:'break-word'}}>{state.mainTitle}</div>
        <div style={{fontSize:11,color:shade(p.c3,40),marginTop:6}}>{state.subtitle}</div>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',position:'relative',zIndex:2,marginTop:8}}>
        <div style={{fontSize:9,color:T.ink3,letterSpacing:'.12em',textTransform:'uppercase'}}>{state.rev} · {state.projectDate}</div>
        <div style={{textAlign:'right'}}>
          {bits.length>0&&<div style={{display:'flex',flexDirection:'column',gap:1,alignItems:'flex-end',marginBottom:3}}>
            {bits.map((b,i)=><div key={i} style={{fontSize:'clamp(5px,.6vw,8px)',color:shade(p.c3,50),letterSpacing:'.08em',textTransform:'uppercase'}}>
              <span style={{opacity:.5}}>{b.k} </span><strong style={{fontWeight:600,opacity:.8}}>{b.v}</strong>
            </div>)}
          </div>}
          <div style={{fontSize:9,color:T.ink3,letterSpacing:'.08em'}}>{state.client}</div>
        </div>
      </div>
    </div>
    <div style={{background:p.c2,opacity:.65}}/>
    <BindingMarks isRing={isRing}/>
  </div>;
}

function IndexPage({state,isPortrait,isRing,pageIndex=0}) {
  const p=state.palette,allRows=[];
  const totalRowCount=state.contentOrder.filter(it=>
    it.type==='cat'||(state.idxMode!=='cats'&&state.files.find(x=>x.id===it.fileId))
  ).length;
  const nIdxPages=Math.max(1,Math.ceil(totalRowCount/40));
  let pgN=2+nIdxPages;
  if(state.enMat)pgN+=state.thumbCount>18?2:1;
  state.contentOrder.forEach(it=>{
    if(it.type==='cat'){allRows.push({name:it.name,page:pgN,isCat:true});pgN+=1;}
    else if(state.idxMode!=='cats'){const f=state.files.find(x=>x.id===it.fileId);if(f){const dn=it.label||f.name.replace(/\.[^.]+$/,'');allRows.push({name:dn,page:pgN,isCat:false});pgN+=f.pages||1;}else pgN+=1;}
  });
  const pageRows=allRows.slice(pageIndex*40,(pageIndex+1)*40);
  const col1=pageRows.slice(0,20),col2=pageRows.slice(20,40);
  const Row=({r,i})=><div key={i} style={{display:'flex',alignItems:'baseline',gap:4,padding:'5px 0',borderBottom:`1px dotted ${T.line}`,fontSize:11}}>
    <span style={{flex:1,color:r.isCat?p.c2:T.ink2,fontWeight:r.isCat?700:400}}>{r.name}</span>
    <span style={{color:r.isCat?p.c2:T.ink3,fontWeight:r.isCat?600:400}}>{String(r.page).padStart(2,'0')}</span>
  </div>;
  return <div style={{width:'100%',aspectRatio:isPortrait?'210/297':'297/210',background:'#fff',padding:'5% '+(isRing?'9% 4% 12%':'9% 4% 5%'),position:'relative',overflow:'hidden',boxSizing:'border-box'}}>
    <div style={{position:'absolute',top:0,right:0,bottom:0,width:'7%',background:p.c1,borderLeft:`3px solid ${p.c2}`}}/>
    <h3 style={{fontSize:22,fontWeight:800,letterSpacing:'.08em',color:p.c3,margin:'0 0 12px'}}>INDEX{nIdxPages>1?` · ${pageIndex+1}/${nIdxPages}`:''}</h3>
    <div style={{display:'grid',gridTemplateColumns:col2.length?'1fr 1fr':'1fr',gap:'0 16px'}}>
      <div>{col1.map((r,i)=><Row key={i} r={r} i={i}/>)}</div>
      {col2.length>0&&<div>{col2.map((r,i)=><Row key={i} r={r} i={i}/>)}</div>}
    </div>
    <BindingMarks isRing={isRing}/>
  </div>;
}

function CatPage({state,catName,isPortrait,isRing}) {
  const p=state.palette;
  return <div style={{width:'100%',aspectRatio:isPortrait?'210/297':'297/210',background:'#fff',display:'grid',placeItems:'center',position:'relative',padding:isRing?'8% 8% 8% 14%':'8%',overflow:'hidden',boxSizing:'border-box'}}>
    <div style={{position:'absolute',top:0,left:0,right:0,height:'16%',background:p.c1,borderBottom:`1px solid ${p.c2}`}}/>
    <div style={{position:'absolute',bottom:0,left:0,right:0,height:'16%',background:p.c1,borderTop:`1px solid ${p.c2}`}}/>
    <div style={{textAlign:'center',position:'relative',zIndex:2}}>
      <div style={{fontSize:'clamp(28px,4vw,52px)',fontWeight:800,letterSpacing:'.08em',color:p.c3}}>{catName}</div>
      <div style={{width:60,height:1.5,background:p.c2,margin:'12px auto'}}/>
      <div style={{fontSize:10,letterSpacing:'.25em',textTransform:'uppercase',color:p.c2}}>SECTION</div>
    </div>
    <BindingMarks isRing={isRing}/>
  </div>;
}

function ContentPage({state,file,pageIdx,isPortrait,isRing,rotation,pageUrl,pageKey}) {
  const p=state.palette,isNotes=state.pageFormat.includes('notes');
  const rot=rotation||0;
  const needsScale=rot===90||rot===270;
  const hasAnn=!!(state.annotations?.[pageKey]);
  const displayUrl=state.annotSnaps?.[pageKey]||pageUrl;
  const notesCtx=React.useContext(NotesEditCtx);
  const editorRef=useRef(null);
  const savedHtml=notesCtx?.pageNotes?.[pageKey]||'';

  useEffect(()=>{
    if(editorRef.current) editorRef.current.innerHTML=savedHtml;
  },[pageKey]);

  const exec=(cmd,val=null)=>{
    editorRef.current?.focus();
    document.execCommand(cmd,false,val);
    if(notesCtx?.onUpdateNotes) notesCtx.onUpdateNotes(pageKey, editorRef.current?.innerHTML||'');
  };

  const nb=(label,cmd,val,style={})=>(
    <button onMouseDown={e=>{e.preventDefault();exec(cmd,val);}}
      style={{background:'transparent',border:'none',cursor:'pointer',padding:'1px 3px',borderRadius:2,fontSize:8.5,fontWeight:600,color:shade(p.c3,30),lineHeight:1,...style}}>{label}</button>
  );

  return <div style={{width:'100%',aspectRatio:isPortrait?'210/297':'297/210',background:'#fff',position:'relative',overflow:'hidden'}}>
    <div style={{position:'absolute',top:0,right:0,bottom:0,width:'8%',background:p.c1,borderLeft:`3px solid ${p.c2}`,display:'flex',flexDirection:'column',alignItems:'center',paddingTop:'4%'}}>
      <div style={{width:22,height:22,borderRadius:'50%',background:T.navy,color:'#fff',display:'grid',placeItems:'center',fontSize:10,fontWeight:800}}>A</div>
    </div>
    {/* Image zone — extra bottom margin when rotated + notes to avoid overlap */}
    <div style={{position:'absolute',top:'4%',right:'11%',bottom:isNotes?(needsScale?'28%':'22%'):'4%',left:isRing?'14%':'4%',overflow:'hidden',display:'grid',placeItems:'center'}}>
      {displayUrl
        ?<img src={displayUrl} alt={file.name} style={{maxWidth:'100%',maxHeight:'100%',objectFit:'contain',transform:rot?`rotate(${rot}deg) scale(${needsScale?(isNotes?0.68:0.72):1})`:'none',transition:'transform .2s'}}/>
        :<div style={{position:'absolute',inset:0,background:`repeating-linear-gradient(135deg,${shade(p.c1,4)} 0 14px,${p.c1} 14px 28px)`,display:'grid',placeItems:'center',fontSize:10,letterSpacing:'.12em',textTransform:'uppercase',color:shade(p.c3,80)}}>
          {file.name.replace(/\.[^.]+$/,'')} {pageIdx>0?`(${pageIdx+1})`:''}
        </div>
      }
      {hasAnn&&<div style={{position:'absolute',top:4,left:4,background:T.gold,color:'#fff',fontSize:7,fontWeight:700,padding:'2px 6px',borderRadius:3,letterSpacing:'.1em',boxShadow:'0 1px 4px rgba(0,0,0,.18)'}}>ANNOTÉ</div>}
    </div>
    {/* Notes zone — height 17%, bottom 3% */}
    {isNotes&&(
      <div style={{position:'absolute',left:isRing?'14%':'4%',right:'11%',bottom:'3%',height:'17%',background:'#fff',border:`1px solid ${p.c1}`,display:'flex',flexDirection:'column',overflow:'hidden'}}>
        {/* Compact toolbar — only when editing context available */}
        {notesCtx&&(
          <div style={{display:'flex',alignItems:'center',gap:1,padding:'1px 3px',borderBottom:`1px solid ${shade(p.c1,-6)}`,flexShrink:0,background:shade(p.c1,8),flexWrap:'wrap'}}>
            {nb('B','bold',null,{fontStyle:'normal',fontWeight:900})}
            {nb('I','italic',null,{fontStyle:'italic'})}
            {nb('U','underline',null,{textDecoration:'underline'})}
            {nb('S̶','strikeThrough')}
            <span style={{width:1,height:9,background:shade(p.c1,-10),margin:'0 1px'}}/>
            {nb('S','fontSize','1')}
            {nb('M','fontSize','3')}
            {nb('L','fontSize','5')}
            <span style={{width:1,height:9,background:shade(p.c1,-10),margin:'0 1px'}}/>
            {nb('≡L','justifyLeft')}
            {nb('≡C','justifyCenter')}
            {nb('≡R','justifyRight')}
            <span style={{width:1,height:9,background:shade(p.c1,-10),margin:'0 1px'}}/>
            {nb('•','insertUnorderedList')}
            {nb('1.','insertOrderedList')}
            <span style={{width:1,height:9,background:shade(p.c1,-10),margin:'0 1px'}}/>
            {nb('✕','removeFormat')}
            <span style={{width:1,height:9,background:shade(p.c1,-10),margin:'0 1px'}}/>
            {['#1A1F2E','#555','#C53030','#2B6CB0','#276749','#D69E2E'].map(c=>(
              <button key={c} onMouseDown={e=>{e.preventDefault();exec('foreColor',c);}}
                style={{width:8,height:8,borderRadius:'50%',background:c,border:'1px solid rgba(0,0,0,.15)',cursor:'pointer',padding:0,flexShrink:0}}/>
            ))}
          </div>
        )}
        {/* Editable / read-only content */}
        {notesCtx
          ?<div ref={editorRef} contentEditable suppressContentEditableWarning
              onInput={()=>notesCtx.onUpdateNotes?.(pageKey,editorRef.current?.innerHTML||'')}
              style={{flex:1,padding:'2px 4px',fontSize:8.5,outline:'none',overflowY:'auto',fontFamily:'inherit',color:shade(p.c3,40),lineHeight:1.4}}/>
          :<div style={{flex:1,padding:'2px 4px',fontSize:8.5,color:shade(p.c3,40),lineHeight:1.4,overflow:'hidden'}}
              dangerouslySetInnerHTML={{__html:savedHtml||`<span style="opacity:.35">Notes…</span>`}}/>
        }
      </div>
    )}
    <div style={{position:'absolute',bottom:'2%',left:isRing?'14%':'4%',fontSize:9,color:shade(p.c3,50)}}>{String(pageIdx+5).padStart(2,'0')}</div>
    <BindingMarks isRing={isRing}/>
  </div>;
}

// ── MAT PAGE — con immagini ───────────────────────────────
function MatPage({state,isPortrait,isRing,pageIndex=0}) {
  const p=state.palette,cols=isPortrait?4:6,rows=isPortrait?4:3,perPage=cols*rows;
  const start=pageIndex*perPage;
  const cells=Array.from({length:perPage}).map((_,i)=>state.materials[start+i]);
  return <div style={{width:'100%',aspectRatio:isPortrait?'210/297':'297/210',background:'#fff',padding:isRing?'3% 2% 3% 9%':'3% 2%',position:'relative',overflow:'hidden',boxSizing:'border-box'}}>
    <div style={{fontSize:10,letterSpacing:'.18em',textTransform:'uppercase',marginBottom:'1.6%',color:p.c3}}>
      MATÉRIAUX{state.thumbCount>perPage?` · ${pageIndex+1}/2`:''}
    </div>
    <div style={{display:'grid',gridTemplateColumns:`repeat(${cols},1fr)`,gridTemplateRows:`repeat(${rows},1fr)`,gap:5,height:'90%'}}>
      {cells.map((m,i)=>m?(
        <div key={i} style={{border:`1px solid ${p.c1}`,display:'flex',flexDirection:'column',overflow:'hidden'}}>
          {/* Image wrapper — div carries the flex-basis so all photo areas are identical */}
          <div style={{flex:'1 1 0',minHeight:0,position:'relative',overflow:'hidden'}}>
            {m.imgUrl
              ?<img src={m.imgUrl} alt={m.mat} style={{display:'block',position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',objectPosition:'center'}}/>
              :<div style={{position:'absolute',inset:0,background:`linear-gradient(135deg,${shade(p.c1,4)} 0 50%,${p.c1} 50% 100%)`}}/>
            }
          </div>
          {/* Text area — fixed natural height, always at the same vertical position */}
          <div style={{flexShrink:0,padding:'3px 5px',background:'#fff',borderTop:`1px solid ${p.c1}`,overflow:'hidden'}}>
            <div style={{fontSize:9,fontWeight:700,color:p.c3,overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis'}}>{m.mat}</div>
            <div style={{fontSize:8,color:shade(p.c3,40),overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis'}}>{m.fin}</div>
          </div>
        </div>
      ):<div key={i} style={{border:`1px dashed ${T.lineSoft}`,borderRadius:2}}/>)}
    </div>
    <BindingMarks isRing={isRing}/>
  </div>;
}

function NotesPage({state,isPortrait,isRing}) {
  const p=state.palette;
  return <div style={{width:'100%',aspectRatio:isPortrait?'210/297':'297/210',background:'#fff',padding:isRing?'9% 9% 9% 14%':'9%',position:'relative',overflow:'hidden',boxSizing:'border-box'}}>
    <div style={{fontSize:10,letterSpacing:'.18em',textTransform:'uppercase',color:p.c3,marginBottom:'3%'}}>NOTES</div>
    <div
      style={{fontSize:11,color:'#222',lineHeight:1.7,wordBreak:'break-word'}}
      dangerouslySetInnerHTML={{__html:state.noteHtml||'<span style="color:#bbb;font-style:italic">Vos notes apparaîtront ici…</span>'}}
    />
    <BindingMarks isRing={isRing}/>
  </div>;
}

function BackPage({state,isPortrait,isRing}) {
  const p=state.palette;
  return <div style={{width:'100%',aspectRatio:isPortrait?'210/297':'297/210',background:'#fff',padding:isRing?'6% 5% 6% 12%':'6% 5%',position:'relative',overflow:'hidden',boxSizing:'border-box'}}>
    <div style={{position:'absolute',top:'15%',left:isRing?'13%':'4%',fontSize:'clamp(48px,8vw,110px)',fontWeight:900,color:shade(p.c1,-8),lineHeight:1}}>{state.backDecor}</div>
    <div style={{position:'absolute',top:'6%',right:'5%',textAlign:'right',fontSize:10,color:shade(p.c3,40),lineHeight:1.7}}>
      <div style={{padding:'4px 10px',background:T.navy,borderRadius:3,marginLeft:'auto',marginBottom:8,display:'inline-block'}}><span style={{color:'#fff',fontWeight:900,fontSize:9,letterSpacing:1}}>ABRANE</span></div>
      {state.backLines.map((l,i)=><div key={i}>{l}</div>)}
    </div>
    <div style={{position:'absolute',right:0,bottom:0,width:'48%',height:'50%',background:`repeating-linear-gradient(135deg,${shade(p.c1,4)} 0 14px,${p.c1} 14px 28px)`,opacity:.35}}/>
    <BindingMarks isRing={isRing}/>
  </div>;
}

const buildPageList = s => {
  const pages=[];
  pages.push({key:'cover',type:'cover',label:'Couverture'});
  if(s.enIdx) {
    const totalRowCount=s.contentOrder.filter(it=>
      it.type==='cat'||(s.idxMode!=='cats'&&s.files.find(x=>x.id===it.fileId))
    ).length;
    const nIdxPages=Math.max(1,Math.ceil(totalRowCount/40));
    for(let i=0;i<nIdxPages;i++) pages.push({key:'idx'+i,type:'index',label:'Sommaire',pageIndex:i});
  }
  if(s.enMat) {
    const isP=s.pageFormat.startsWith('v');
    const perPage=(isP?4:6)*(isP?4:3);
    const nPgs=s.thumbCount>perPage?2:1;
    for(let i=0;i<nPgs;i++) pages.push({key:'mat'+i,type:'materials',label:'Matériaux',pageIndex:i});
  }
  if(s.enNotes) pages.push({key:'notes0',type:'notes',label:'Notes'});
  s.contentOrder.forEach(it=>{
    if(it.type==='cat') pages.push({key:'cat-'+it.id,type:'category',label:it.name,catName:it.name});
    else{const f=s.files.find(x=>x.id===it.fileId);if(!f)return;const dn=it.label||f.name.replace(/\.[^.]+$/,'');for(let i=0;i<(f.pages||1);i++)pages.push({key:'f-'+it.id+'-'+i,type:'content',label:dn,file:f,pageIdx:i,rotation:it.rotation||0,pageUrl:(f.pageUrls&&f.pageUrls[i])||null});}
  });

  pages.push({key:'back',type:'back',label:'Quatrième de couverture'});
  return pages;
};

function PageRender({page,state}) {
  const isP=state.pageFormat.startsWith('v'),isR=state.pageFormat.includes('ring');
  switch(page.type){
    case 'cover':     return <CoverPage   state={state} isPortrait={isP} isRing={isR}/>;
    case 'index':     return <IndexPage   state={state} isPortrait={isP} isRing={isR} pageIndex={page.pageIndex||0}/>;
    case 'materials': return <MatPage     state={state} isPortrait={isP} isRing={isR} pageIndex={page.pageIndex||0}/>;
    case 'category':  return <CatPage     state={state} catName={page.catName} isPortrait={isP} isRing={isR}/>;
    case 'content':   return <ContentPage state={state} file={page.file} pageIdx={page.pageIdx} isPortrait={isP} isRing={isR} rotation={page.rotation} pageUrl={page.pageUrl} pageKey={page.key}/>;
    case 'notes':     return <NotesPage   state={state} isPortrait={isP} isRing={isR} noteIdx={page.noteIdx||0}/>;
    case 'back':      return <BackPage    state={state} isPortrait={isP} isRing={isR}/>;
    default: return null;
  }
}

function Canvas({state,zoom,setZoom,activePage,onAnnotate,paletteH,onUpdatePageNotes}) {
  const pages=useMemo(()=>buildPageList(state),[state]);
  const isP=state.pageFormat.startsWith('v');
  const canvasRef=useRef(null);
  const pageRefs=useRef([]);
  const notesCtxVal=useMemo(()=>onUpdatePageNotes?{pageNotes:state.pageNotes||{},onUpdateNotes:onUpdatePageNotes}:null,[state.pageNotes,onUpdatePageNotes]);

  useEffect(()=>{
    const el=pageRefs.current[activePage];
    if(el&&canvasRef.current) el.scrollIntoView({behavior:'smooth',block:'nearest'});
  },[activePage]);

  const botPad=(paletteH||120)+24;

  return <main ref={canvasRef} style={{flex:1,minWidth:0,overflowY:'auto',background:T.bg,display:'flex',flexDirection:'column',alignItems:'center',padding:`36px 32px ${botPad}px`,position:'relative'}}>
    <div style={{width:'100%',maxWidth:isP?700:1000,display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:18,flexShrink:0}}>
      <div style={{fontSize:11,color:T.ink3,display:'flex',alignItems:'center',gap:10}}>
        <Icon name="layers" size={14} color={T.ink3}/>
        <span>{pages.length} pages · {isP?'A4 Portrait':'A4 Paysage'}</span>
        <span>·</span><span style={{color:T.navy,fontWeight:500}}>{state.client||'Sans client'}</span>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:4,background:'rgba(255,255,255,.95)',border:`1px solid ${T.line}`,borderRadius:999,padding:'4px 8px',fontSize:11.5,boxShadow:'0 2px 8px rgba(0,0,0,.08)'}}>
        <button onClick={()=>setZoom(z=>Math.max(0.4,+(z-.1).toFixed(2)))} style={{background:'transparent',border:'none',padding:'2px 6px',fontSize:15,color:T.ink2,cursor:'pointer',lineHeight:1}}>−</button>
        <span style={{minWidth:36,textAlign:'center'}}>{Math.round(zoom*100)}%</span>
        <button onClick={()=>setZoom(z=>Math.min(2,+(z+.1).toFixed(2)))} style={{background:'transparent',border:'none',padding:'2px 6px',fontSize:15,color:T.ink2,cursor:'pointer',lineHeight:1}}>+</button>
        <span style={{width:1,height:14,background:T.line,margin:'0 2px'}}/>
        <button onClick={()=>setZoom(1)} style={{background:'transparent',border:'none',padding:'2px 6px',fontSize:11,color:T.ink2,cursor:'pointer'}}>100%</button>
      </div>
    </div>
    <div style={{display:'flex',flexDirection:'column',gap:24,alignItems:'center',width:'100%',transform:`scale(${zoom})`,transformOrigin:'top center',transition:'transform .15s'}}>
      {pages.map((p,i)=>(
        <div key={p.key} ref={el=>pageRefs.current[i]=el} style={{width:'100%',maxWidth:isP?700:1000}}>
          <div style={{fontSize:10,color:T.ink4,letterSpacing:'.08em',textTransform:'uppercase',display:'flex',justifyContent:'space-between',marginBottom:6,padding:'0 2px'}}>
            <span style={{display:'flex',alignItems:'center',gap:6}}>
              {p.label}
              {p.type==='content'&&state.annotations?.[p.key]&&(
                <span style={{background:T.gold,color:'#fff',fontSize:8,fontWeight:700,padding:'1px 5px',borderRadius:3,letterSpacing:'.06em'}}>ANNOTÉ</span>
              )}
            </span>
            <span>Page {i+1} / {pages.length}</span>
          </div>
          <div style={{background:'#fff',boxShadow:'0 6px 22px rgba(20,20,30,.12)',borderRadius:2,position:'relative'}}>
            <NotesEditCtx.Provider value={notesCtxVal}>
              <PageRender page={p} state={state}/>
            </NotesEditCtx.Provider>
            {p.type==='content'&&onAnnotate&&(
              <div style={{position:'absolute',top:8,right:10,zIndex:10}}>
                <button onClick={e=>{e.stopPropagation();onAnnotate(p);}} style={{
                  background:'rgba(15,27,45,.82)',backdropFilter:'blur(6px)',
                  border:`1px solid ${state.annotations?.[p.key]?T.gold:'rgba(255,255,255,.25)'}`,
                  color:'#fff',padding:'4px 10px',borderRadius:5,fontSize:9.5,
                  fontWeight:700,cursor:'pointer',letterSpacing:'.08em',
                  fontFamily:'inherit',display:'flex',alignItems:'center',gap:5,
                  transition:'border-color .15s',
                }}>
                  <Icon name="pencil" size={10} color={state.annotations?.[p.key]?T.gold:'rgba(255,255,255,.7)'}/>
                  {state.annotations?.[p.key]?'MODIFIER':'ANNOTER'}
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  </main>;
}

// ── STEP PANELS ───────────────────────────────────────────
function Toggle({checked,onChange}) {
  return <label style={{position:'relative',width:34,height:20,flexShrink:0,cursor:'pointer',display:'inline-block'}}>
    <input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)} style={{opacity:0,width:0,height:0,position:'absolute'}}/>
    <div style={{position:'absolute',inset:0,background:checked?T.navy:T.lineStrong,borderRadius:999,transition:'.15s'}}>
      <div style={{position:'absolute',width:16,height:16,left:checked?16:2,top:2,background:'#fff',borderRadius:'50%',transition:'.15s',boxShadow:'0 1px 2px rgba(0,0,0,.18)'}}/>
    </div>
  </label>;
}
function Sect({title,children,extra}) {
  return <div style={{display:'flex',flexDirection:'column',gap:10}}>
    <div style={{fontSize:10.5,letterSpacing:'.12em',textTransform:'uppercase',color:T.ink4,fontWeight:600,display:'flex',justifyContent:'space-between',alignItems:'center'}}><span>{title}</span>{extra}</div>
    {children}
  </div>;
}
function Fld({label,hint,children}) {
  return <div style={{display:'flex',flexDirection:'column',gap:5}}>
    {label&&<label style={{fontSize:11,color:T.ink3,fontWeight:500}}>{label}</label>}
    {children}
    {hint&&<span style={{fontSize:11,color:T.ink4}}>{hint}</span>}
  </div>;
}
function RowItem({label,sub,children}) {
  return <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:10}}>
    <div><div style={{fontSize:13,fontWeight:500,color:T.ink}}>{label}</div>{sub&&<div style={{fontSize:11,color:T.ink3}}>{sub}</div>}</div>
    {children}
  </div>;
}

function ProjectPanel({state,update}) {
  const [dragOver,setDragOver]=useState(false);
  const OPT=[
    {key:'showQuoteRef',valKey:'quoteRef',label:'Numéro de devis',ph:'DEV-2026-0142',ico:'fileText'},
    {key:'showInternalRef',valKey:'internalRef',label:'Référence interne',ph:'PRJ-INT-088',ico:'archive'},
    {key:'showContact',valKey:'contact',label:'Contact commercial',ph:'Élise Mercier',ico:'user'},
    {key:'showSendDate',valKey:'sendDate',label:"Date d'envoi",ph:'JJ / MM / AAAA',ico:'history'},
    {key:'showProjectType',valKey:'projectType',label:'Type de projet',ph:'Résidentiel',ico:'bookmark'},
  ];
  const handleLogoDrop=e=>{
    e.preventDefault();setDragOver(false);
    const file=e.dataTransfer?.files?.[0]||e.target?.files?.[0];
    if(!file||!file.type.startsWith('image/'))return;
    const r=new FileReader();r.onload=ev=>update({clientLogoUrl:ev.target.result});r.readAsDataURL(file);
  };
  return <>
    <Sect title="Identification">
      <Fld label="Nom du client"><input style={{...inputSt,padding:'10px 12px',fontSize:13}} value={state.client} onChange={e=>update({client:e.target.value})} placeholder="ex. SANDRO"/></Fld>
      <Fld label="Sous-titre / projet"><input style={inputSt} value={state.subtitle} onChange={e=>update({subtitle:e.target.value})}/></Fld>
      <div style={{display:'flex',gap:8}}>
        <Fld label="Année"><input style={inputSt} value={state.year} onChange={e=>update({year:e.target.value})}/></Fld>
        <Fld label="Révision"><input style={inputSt} value={state.rev} onChange={e=>update({rev:e.target.value})}/></Fld>
      </div>
      <Fld label="Date du document" hint="Mise à jour automatique à l'ouverture. Modifiable si besoin.">
        <input style={inputSt} value={state.projectDate} onChange={e=>update({projectDate:e.target.value})} placeholder="JJ/MM/AAAA"/>
      </Fld>
    </Sect>
    <Sect title="Logo client">
      {state.clientLogoUrl?(
        <div style={{display:'flex',alignItems:'center',gap:12,padding:'10px 12px',background:T.panel,border:`1px solid ${T.line}`,borderRadius:8}}>
          <img src={state.clientLogoUrl} alt="logo" style={{height:40,maxWidth:120,objectFit:'contain'}}/>
          <div style={{flex:1,fontSize:11,color:T.ink3}}>Logo chargé</div>
          <button style={{background:'transparent',border:'none',cursor:'pointer',padding:4}} onClick={()=>update({clientLogoUrl:''})}><Icon name="trash" size={13} color={T.ink3}/></button>
        </div>
      ):(
        <label onDragOver={e=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)} onDrop={handleLogoDrop}
          style={{border:`1.5px dashed ${dragOver?T.navy:T.lineStrong}`,borderRadius:8,padding:18,textAlign:'center',background:dragOver?T.navyTint:T.panel,cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:6,transition:'.15s'}}>
          <Icon name="image" size={22} color={dragOver?T.navy:T.gold}/>
          <strong style={{color:T.ink,fontSize:12.5}}>Glissez le logo client</strong>
          <span style={{fontSize:11,color:T.ink3}}>PNG / SVG / JPG · ou cliquez pour parcourir</span>
          <input type="file" accept="image/*" style={{display:'none'}} onChange={handleLogoDrop}/>
        </label>
      )}
      {state.clientLogoUrl&&<Fld label={`Taille du logo · ${state.logoScale}%`}>
        <input type="range" min="20" max="300" value={state.logoScale} onChange={e=>update({logoScale:parseInt(e.target.value)})} style={{width:'100%',accentColor:T.navy}}/>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:T.ink4}}><span>Petit</span><span>Normal</span><span>Grand</span></div>
      </Fld>}
      <div style={{padding:'8px 12px',background:T.navyTint,border:`1px solid #D2DBEC`,borderRadius:8,fontSize:11,color:T.ink3}}>Le logo <strong style={{color:T.ink}}>ABRANE</strong> est intégré automatiquement en haut à droite.</div>
    </Sect>
    <Sect title="Informations complémentaires" extra={<span style={{fontSize:11,color:T.ink3}}>{OPT.filter(f=>state[f.key]).length}/{OPT.length}</span>}>
      <div style={{fontSize:11,color:T.ink3,marginBottom:2}}>Ces informations apparaissent sur la couverture quand elles sont activées.</div>
      {OPT.map(f=>{const on=!!state[f.key];return(
        <div key={f.key} style={{background:on?'#fff':T.panel,border:`1px solid ${on?T.line:T.lineSoft}`,borderRadius:8,padding:on?'10px 12px':'8px 12px',display:'flex',flexDirection:'column',gap:on?8:0,transition:'.15s'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8}}>
            <div style={{display:'flex',alignItems:'center',gap:8}}><Icon name={f.ico} size={14} color={on?T.navy:T.ink4}/><div style={{fontSize:12.5,fontWeight:500,color:on?T.ink:T.ink3}}>{f.label}</div></div>
            <Toggle checked={on} onChange={v=>update({[f.key]:v})}/>
          </div>
          {on&&(f.valKey==='sendDate'
            ?<input type="date" lang="fr" style={inputSt} value={state.sendDate?state.sendDate.split('/').reverse().join('-'):''} onChange={e=>{const [y,m,d]=(e.target.value||'--').split('-');update({sendDate:e.target.value?`${d}/${m}/${y}`:''});}}/>
            :<input style={inputSt} value={state[f.valKey]||''} placeholder={f.ph} onChange={e=>update({[f.valKey]:e.target.value})}/>)}
        </div>
      );})}
    </Sect>
  </>;
}

function PalettePanel({state,update,updateNested}) {
  const isOn=p=>p.c[0]===state.palette.c1&&p.c[1]===state.palette.c2&&p.c[2]===state.palette.c3;
  return <>
    <Sect title="Couleurs">
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
        {[['c1','Fond'],['c2','Accent'],['c3','Texte']].map(([k,l])=><div key={k} style={{display:'flex',flexDirection:'column',gap:4,padding:8,background:T.panel,border:`1px solid ${T.lineSoft}`,borderRadius:6}}>
          <input type="color" value={state.palette[k]} onChange={e=>updateNested('palette',{[k]:e.target.value})} style={{width:'100%',height:28,border:`1px solid ${T.line}`,borderRadius:4,padding:1,cursor:'pointer'}}/>
          <div style={{fontSize:10,color:T.ink3,textAlign:'center'}}>{l}</div>
        </div>)}
      </div>
    </Sect>
    <Sect title="Palettes prédéfinies">
      <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
        {PALETTE_PRESETS.map(p=><button key={p.id} title={p.name} onClick={()=>update({palette:{c1:p.c[0],c2:p.c[1],c3:p.c[2]}})} style={{width:36,height:24,borderRadius:4,display:'grid',gridTemplateColumns:'1fr 1fr 1fr',border:`${isOn(p)?'2px solid '+T.navy:'1px solid '+T.line}`,overflow:'hidden',cursor:'pointer',padding:0}}>
          {p.c.map((c,i)=><span key={i} style={{background:c}}/>)}
        </button>)}
      </div>
    </Sect>
  </>;
}

function FormatPanel({state,update}) {
  const cur=PAGE_FORMATS.find(f=>f.id===state.pageFormat)||PAGE_FORMATS[0];
  return <>
    <Sect title="Format actuel">
      <div style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',background:T.navyTint,border:`1px solid #D2DBEC`,borderRadius:8}}>
        <Icon name={cur.icon} size={22} color={T.navy}/>
        <div style={{flex:1}}><div style={{fontSize:12.5,fontWeight:600,color:T.ink}}>{cur.name}</div><div style={{fontSize:11,color:T.ink3}}>{cur.desc}</div></div>
      </div>
    </Sect>
    <Sect title="Choisir">
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))',gap:8}}>
        {PAGE_FORMATS.map(f=><button key={f.id} onClick={()=>update({pageFormat:f.id})} style={{padding:8,textAlign:'left',background:T.surface,border:`${f.id===state.pageFormat?2:1}px solid ${f.id===state.pageFormat?T.navy:T.line}`,borderRadius:8,cursor:'pointer'}}>
          <div style={{marginBottom:6,borderRadius:4,overflow:'hidden'}}><FormatThumb id={f.id} accent="#C8A96E"/></div>
          <div style={{fontSize:11,fontWeight:500,color:T.ink}}>{f.name.replace(/^[^—]+— /,'')}</div>
        </button>)}
      </div>
    </Sect>
  </>;
}

function CoverPanel({state,update}) {
  const [dragBg,setDragBg]=useState(false);
  const handleBgDrop=e=>{
    e.preventDefault();setDragBg(false);
    const file=e.dataTransfer?.files?.[0]||e.target?.files?.[0];
    if(!file||!file.type.startsWith('image/'))return;
    const r=new FileReader();r.onload=ev=>update({bgImageUrl:ev.target.result});r.readAsDataURL(file);
  };
  return <>
    <Sect title="Titres">
      <Fld label="Titre principal" hint="S'affiche en grand sur la couverture.">
        <input style={{...inputSt,padding:'10px 12px',fontSize:16,fontWeight:700,letterSpacing:'-.01em'}} value={state.mainTitle} onChange={e=>update({mainTitle:e.target.value})} placeholder="ex. BOOK"/>
      </Fld>
      <Fld label="Sous-titre"><input style={inputSt} value={state.subtitle} onChange={e=>update({subtitle:e.target.value})}/></Fld>
    </Sect>
    <Sect title="Photo de fond">
      {state.bgImageUrl?(
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          <div style={{display:'flex',alignItems:'center',gap:12,padding:'10px 12px',background:T.panel,border:`1px solid ${T.line}`,borderRadius:8}}>
            <img src={state.bgImageUrl} alt="bg" style={{height:40,width:60,objectFit:'cover',borderRadius:4,objectPosition:`${state.bgX}% ${state.bgY}%`}}/>
            <div style={{flex:1}}><div style={{fontSize:12,fontWeight:500,color:T.ink}}>Image chargée</div><div style={{fontSize:11,color:T.ink3}}>Opacité 20%</div></div>
            <button style={{background:'transparent',border:'none',cursor:'pointer',padding:4}} onClick={()=>update({bgImageUrl:'',bgX:50,bgY:50,bgScale:100})}><Icon name="trash" size={13} color={T.ink3}/></button>
          </div>
          <Fld label={`Zoom · ${state.bgScale}%`}>
            <input type="range" min="50" max="300" value={state.bgScale} onChange={e=>update({bgScale:parseInt(e.target.value)})} style={{width:'100%',accentColor:T.navy}}/>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:T.ink4}}><span>Petit</span><span>Grand</span></div>
          </Fld>
          <Fld label={`Position horizontale · ${state.bgX}%`}>
            <input type="range" min="0" max="100" value={state.bgX} onChange={e=>update({bgX:parseInt(e.target.value)})} style={{width:'100%',accentColor:T.navy}}/>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:T.ink4}}><span>← Gauche</span><span>Droite →</span></div>
          </Fld>
          <Fld label={`Position verticale · ${state.bgY}%`}>
            <input type="range" min="0" max="100" value={state.bgY} onChange={e=>update({bgY:parseInt(e.target.value)})} style={{width:'100%',accentColor:T.navy}}/>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:T.ink4}}><span>↑ Haut</span><span>Bas ↓</span></div>
          </Fld>
        </div>
      ):(
        <label onDragOver={e=>{e.preventDefault();setDragBg(true);}} onDragLeave={()=>setDragBg(false)} onDrop={handleBgDrop}
          style={{border:`1.5px dashed ${dragBg?T.navy:T.lineStrong}`,borderRadius:8,padding:18,textAlign:'center',background:dragBg?T.navyTint:T.panel,cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:6,transition:'.15s'}}>
          <Icon name="image" size={22} color={dragBg?T.navy:T.gold}/>
          <strong style={{color:T.ink,fontSize:12.5}}>Glissez une photo de fond</strong>
          <span style={{fontSize:11,color:T.ink3}}>Affichée à 20% · JPG / PNG</span>
          <input type="file" accept="image/*" style={{display:'none'}} onChange={handleBgDrop}/>
        </label>
      )}
    </Sect>
  </>;
}

function IndexPanel({state,update}) {
  return <>
    <Sect title="Index"><RowItem label="Activer l'index" sub="Sommaire automatique"><Toggle checked={state.enIdx} onChange={v=>update({enIdx:v})}/></RowItem></Sect>
    {state.enIdx&&<Sect title="Options"><Fld label="Contenu"><select style={inputSt} value={state.idxMode} onChange={e=>update({idxMode:e.target.value})}><option value="all">Catégories + fichiers</option><option value="cats">Catégories uniquement</option></select></Fld></Sect>}
  </>;
}

// ── MATERIALS PANEL — con upload per vignetta + import multiplo ──
function MaterialsPanel({state,update}) {
  const isP=state.pageFormat.startsWith('v');
  const perPage=(isP?4:6)*(isP?4:3);
  const twoPages=state.thumbCount>perPage;

  const parseFileName = name => {
    const base = name.replace(/\.[^.]+$/, '');
    const sep = base.includes(' - ') ? ' - ' : null;
    if(sep) {
      const parts = base.split(sep);
      return {mat: parts[0].trim(), fin: parts.slice(1).join(sep).trim()};
    }
    return {mat: base.trim(), fin: ''};
  };

  const handleMultiUpload = e => {
    const files = Array.from(e.target.files); if(!files.length) return;
    const mats = [...state.materials];
    let done = 0;
    files.forEach((file, i) => {
      const r = new FileReader();
      r.onload = ev => {
        const parsed = parseFileName(file.name);
        mats[i] = {...(mats[i]||{}), mat: parsed.mat, fin: parsed.fin, imgUrl: ev.target.result};
        done++;
        if(done === files.length) update({materials:[...mats], thumbCount: Math.max(state.thumbCount, Math.min(36, files.length))});
      };
      r.readAsDataURL(file);
    });
  };

  const handleSingleUpload = (idx, e) => {
    const file = e.target.files?.[0]; if(!file) return;
    const parsed = parseFileName(file.name);
    const r = new FileReader();
    r.onload = ev => {
      const mats = [...state.materials];
      mats[idx] = {...(mats[idx]||{}), mat: parsed.mat, fin: parsed.fin, imgUrl: ev.target.result};
      update({materials: mats});
    };
    r.readAsDataURL(file);
  };

  const updateMat = (idx, patch) => {
    const mats = [...state.materials];
    mats[idx] = {...(mats[idx]||{mat:'',fin:'',imgUrl:''}), ...patch};
    update({materials: mats});
  };

  return <>
    <Sect title="Matériaux">
      <RowItem label="Activer la page Matériaux" sub="Jusqu'à 36 vignettes (2 pages si > 18)">
        <Toggle checked={state.enMat} onChange={v=>update({enMat:v})}/>
      </RowItem>
    </Sect>
    {state.enMat&&<>
      <Sect title="Nombre de vignettes">
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <span style={{fontSize:12,color:T.ink2}}>Vignettes</span>
          <div style={{display:'inline-flex',padding:2,background:T.panel2,borderRadius:6,alignItems:'center'}}>
            <button style={{border:'none',background:'transparent',padding:'3px 8px',cursor:'pointer',fontSize:13}} onClick={()=>update({thumbCount:Math.max(1,state.thumbCount-1)})}>−</button>
            <span style={{padding:'3px 10px',background:'#fff',borderRadius:4,fontSize:12,fontWeight:600}}>{state.thumbCount}</span>
            <button style={{border:'none',background:'transparent',padding:'3px 8px',cursor:'pointer',fontSize:13}} onClick={()=>update({thumbCount:Math.min(36,state.thumbCount+1)})}>+</button>
          </div>
        </div>
        {twoPages&&<div style={{padding:'6px 10px',background:T.navyTint,border:`1px solid #D2DBEC`,borderRadius:6,fontSize:11,color:T.navy}}>
          <Icon name="info" size={11} color={T.navy} style={{verticalAlign:'-2px',marginRight:5}}/>
          {state.thumbCount} vignettes · 2 pages générées automatiquement
        </div>}
      </Sect>
      <Sect title="Vignettes"
        extra={
          <label style={{...btnSt(undefined,true),cursor:'pointer',gap:5}}>
            <Icon name="upload" size={12} color={T.ink}/>Importer tout
            <input type="file" accept="image/*" multiple style={{display:'none'}} onChange={handleMultiUpload}/>
          </label>
        }>
        <div style={{fontSize:11,color:T.ink3,lineHeight:1.5}}>Cliquez sur une vignette pour changer l'image individuellement.</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6}}>
          {Array.from({length:state.thumbCount}).map((_,i)=>{
            const m=state.materials[i]||{mat:'',fin:'',imgUrl:''};
            return(
              <label key={i} style={{background:T.panel,border:`1px solid ${T.lineSoft}`,borderRadius:6,cursor:'pointer',display:'flex',flexDirection:'column',overflow:'hidden',padding:0,position:'relative'}}>
                <input type="file" accept="image/*" style={{display:'none'}} onChange={e=>handleSingleUpload(i,e)}/>
                {/* Image area — aspect-ratio forces uniform square; img fills it with cover */}
                <div style={{aspectRatio:'1/1',position:'relative',overflow:'hidden',width:'100%'}}>
                  {m.imgUrl
                    ?<img src={m.imgUrl} alt={m.mat} style={{display:'block',position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',objectPosition:'center'}}/>
                    :<div style={{position:'absolute',inset:0,background:`linear-gradient(135deg,${T.panel} 0 50%,${T.panel2} 50% 100%)`,display:'grid',placeItems:'center'}}>
                      <Icon name="upload" size={14} color={T.ink5}/>
                    </div>
                  }
                  {/* hover overlay */}
                  <div style={{position:'absolute',inset:0,background:'rgba(27,46,92,.18)',opacity:0,display:'grid',placeItems:'center',transition:'.15s'}}
                    onMouseEnter={e=>e.currentTarget.style.opacity=1}
                    onMouseLeave={e=>e.currentTarget.style.opacity=0}>
                    <Icon name="upload" size={16} color="#fff"/>
                  </div>
                </div>
                {/* Editable fields — stop propagation so click doesn't trigger file input */}
                <div style={{padding:'4px 5px',background:'#fff',borderTop:`1px solid ${T.lineSoft}`,display:'flex',flexDirection:'column',gap:2}} onClick={e=>e.stopPropagation()}>
                  <input
                    style={{width:'100%',border:'none',outline:'none',fontSize:8.5,fontWeight:600,color:T.ink,background:'transparent',padding:'1px 0',fontFamily:'inherit',boxSizing:'border-box'}}
                    value={m.mat||''}
                    placeholder="Matière"
                    onChange={e=>updateMat(i,{mat:e.target.value})}
                    onClick={e=>e.stopPropagation()}
                  />
                  <input
                    style={{width:'100%',border:'none',outline:'none',fontSize:8,color:T.ink3,background:'transparent',padding:'1px 0',fontFamily:'inherit',boxSizing:'border-box'}}
                    value={m.fin||''}
                    placeholder="Finition"
                    onChange={e=>updateMat(i,{fin:e.target.value})}
                    onClick={e=>e.stopPropagation()}
                  />
                </div>
              </label>
            );
          })}
        </div>
      </Sect>
    </>}
  </>;
}

function NotesPanel({state,update}) {
  const editorRef=useRef(null);
  useEffect(()=>{
    if(editorRef.current) editorRef.current.innerHTML=state.noteHtml||'';
  },[]);
  const exec=(cmd,val=null)=>{
    editorRef.current?.focus();
    document.execCommand(cmd,false,val);
    update({noteHtml:editorRef.current?.innerHTML||''});
  };
  const setSize=sz=>{
    const map={S:'1',M:'3',L:'5',XL:'7'};
    exec('fontSize',map[sz]||'3');
  };
  const btnStyle=(active)=>({
    padding:'2px 6px',borderRadius:4,border:'none',cursor:'pointer',fontSize:11,
    background:active?T.gold:'transparent',color:active?'#fff':T.ink,fontWeight:600,
  });
  return <>
    <Sect title="Notes">
      <RowItem label="Activer les pages Notes" sub="Annotables en réunion">
        <Toggle checked={state.enNotes} onChange={v=>update({enNotes:v})}/>
      </RowItem>
    </Sect>
    {state.enNotes&&<Sect title="Contenu des notes">
      {/* Formatting toolbar */}
      <div style={{display:'flex',flexWrap:'wrap',gap:3,marginBottom:8,padding:'6px 8px',background:T.panel,borderRadius:6,border:`1px solid ${T.lineSoft}`}}>
        <button style={{...btnStyle(),fontWeight:900}} onMouseDown={e=>{e.preventDefault();exec('bold');}}>B</button>
        <button style={{...btnStyle(),fontStyle:'italic'}} onMouseDown={e=>{e.preventDefault();exec('italic');}}>I</button>
        <button style={{...btnStyle(),textDecoration:'underline'}} onMouseDown={e=>{e.preventDefault();exec('underline');}}>U</button>
        <button style={{...btnStyle(),textDecoration:'line-through'}} onMouseDown={e=>{e.preventDefault();exec('strikeThrough');}}>S</button>
        <div style={{width:1,background:T.lineSoft,margin:'0 3px'}}/>
        {['S','M','L','XL'].map(s=>(
          <button key={s} style={btnStyle()} onMouseDown={e=>{e.preventDefault();setSize(s);}}>{s}</button>
        ))}
        <div style={{width:1,background:T.lineSoft,margin:'0 3px'}}/>
        <button style={btnStyle()} title="Aligner à gauche" onMouseDown={e=>{e.preventDefault();exec('justifyLeft');}}>
          <Icon name="alignL" size={13} color={T.ink}/>
        </button>
        <button style={btnStyle()} title="Centrer" onMouseDown={e=>{e.preventDefault();exec('justifyCenter');}}>
          <Icon name="alignC" size={13} color={T.ink}/>
        </button>
        <button style={btnStyle()} title="Aligner à droite" onMouseDown={e=>{e.preventDefault();exec('justifyRight');}}>
          <Icon name="alignR" size={13} color={T.ink}/>
        </button>
        <div style={{width:1,background:T.lineSoft,margin:'0 3px'}}/>
        <button style={btnStyle()} title="Liste à puces" onMouseDown={e=>{e.preventDefault();exec('insertUnorderedList');}}>•</button>
        <button style={btnStyle()} title="Liste numérotée" onMouseDown={e=>{e.preventDefault();exec('insertOrderedList');}}>1.</button>
        <div style={{width:1,background:T.lineSoft,margin:'0 3px'}}/>
        <button style={btnStyle()} title="Effacer la mise en forme" onMouseDown={e=>{e.preventDefault();exec('removeFormat');}}>✕</button>
      </div>
      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={()=>update({noteHtml:editorRef.current?.innerHTML||''})}
        style={{
          minHeight:180,padding:'10px 12px',borderRadius:6,border:`1.5px solid ${T.lineStrong}`,
          background:'#fff',fontSize:12.5,color:T.ink,lineHeight:1.7,outline:'none',
          wordBreak:'break-word',fontFamily:'inherit',
        }}
        data-placeholder="Saisissez vos notes ici…"
      />
    </Sect>}
  </>;
}
function ContentPanel({state,update}) {
  const fileInputRef=useRef(null);
  const [dragIdx,setDragIdx]=useState(null);
  const [overIdx,setOverIdx]=useState(null);
  const [renaming,setRenaming]=useState(null);
  const [importing,setImporting]=useState(false);

  const handleImport=async e=>{
    const list=Array.from(e.target.files);
    if(!list.length)return;
    setImporting(true);
    const newFiles=[],newOrders=[];
    for(const file of list){
      const ext=file.name.split('.').pop().toLowerCase();
      const isPdf=ext==='pdf';
      let pageCount=1,pageUrls=[];
      try{
        if(isPdf){
          const result=await renderPdfToDataUrls(file);
          pageCount=result.pageCount;
          pageUrls=result.pageUrls;
        } else {
          const dataUrl=await readFileAsDataUrl(file);
          pageUrls=[dataUrl];
        }
      }catch(err){ console.warn('Import error:',err); }
      const sz=file.size>1024*1024?(file.size/1024/1024).toFixed(1)+' Mo':Math.round(file.size/1024)+' Ko';
      const id='f'+Date.now()+'_'+Math.random().toString(36).slice(2,5);
      newFiles.push({id,name:file.name,type:ext,pages:pageCount,size:sz,pageUrls});
      const ordId='fi'+Date.now()+'_'+Math.random().toString(36).slice(2,5);
      newOrders.push({type:'file',id:ordId,fileId:id,rotation:0,label:''});
    }
    update({files:[...state.files,...newFiles],contentOrder:[...state.contentOrder,...newOrders]});
    e.target.value='';
    setImporting(false);
  };

  const handleDelete=ordId=>{
    const item=state.contentOrder.find(x=>x.id===ordId);
    const newOrder=state.contentOrder.filter(x=>x.id!==ordId);
    let newFiles=state.files;
    if(item&&item.type==='file'&&!newOrder.some(x=>x.type==='file'&&x.fileId===item.fileId))
      newFiles=state.files.filter(x=>x.id!==item.fileId);
    update({contentOrder:newOrder,files:newFiles});
  };

  const setRotation=(ordId,deg)=>{
    update({contentOrder:state.contentOrder.map(x=>x.id===ordId?{...x,rotation:deg}:x)});
  };

  const startRename=item=>{
    const f=item.type==='file'?state.files.find(x=>x.id===item.fileId):null;
    const val=item.type==='cat'?item.name:(item.label||f?.name?.replace(/\.[^.]+$/,'')||'');
    setRenaming({id:item.id,val});
  };
  const commitRename=()=>{
    if(!renaming)return;
    const v=renaming.val.trim();
    if(v) update({contentOrder:state.contentOrder.map(x=>{
      if(x.id!==renaming.id)return x;
      return x.type==='cat'?{...x,name:v}:{...x,label:v};
    })});
    setRenaming(null);
  };

  const reorder=(from,to)=>{
    if(from===to||from===null||to===null)return;
    const a=[...state.contentOrder];
    const [item]=a.splice(from,1);
    a.splice(from<to?Math.min(to-1,a.length):to,0,item);
    update({contentOrder:a});
  };

  const addCategory=()=>{
    const id='c'+Date.now();
    update({contentOrder:[...state.contentOrder,{type:'cat',id,name:'Nouvelle catégorie'}]});
  };

  const rotBtnSt=(active)=>({
    padding:'2px 5px',fontSize:9,fontWeight:600,lineHeight:1,
    border:`1px solid ${active?T.gold:T.lineSoft}`,borderRadius:3,cursor:'pointer',
    background:active?T.gold:'transparent',color:active?'#fff':T.ink4,
  });

  return <>
    <Sect title="Importer">
      <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf" style={{display:'none'}} onChange={handleImport}/>
      <div onClick={()=>!importing&&fileInputRef.current?.click()} style={{border:`1.5px dashed ${T.lineStrong}`,borderRadius:8,padding:18,textAlign:'center',background:importing?T.navyTint:T.panel,display:'flex',flexDirection:'column',alignItems:'center',gap:6,cursor:importing?'wait':'pointer',transition:'background .2s'}}>
        <Icon name="upload" size={22} color={importing?T.navy:T.gold}/>
        <strong style={{fontSize:12.5,color:T.ink}}>{importing?'Conversion en cours…':'Cliquez ou glissez vos fichiers'}</strong>
        <span style={{fontSize:12,color:T.ink3}}>{importing?'Chaque page PDF sera convertie en image…':'JPG, PNG — PDF multi-pages (1 page par feuille)'}</span>
      </div>
    </Sect>
    <Sect title={`Ordre · ${state.contentOrder.length} entrées`}>
      <button onClick={addCategory} style={{...btnSt('ghost',true),width:'100%',justifyContent:'center',marginBottom:6}}>
        <Icon name="plus" size={13} color={T.gold}/> Ajouter une catégorie
      </button>
      <div style={{display:'flex',flexDirection:'column',gap:4}}>
        {state.contentOrder.map((item,idx)=>{
          const isCat=item.type==='cat';
          const f=isCat?null:state.files.find(x=>x.id===item.fileId);
          if(!isCat&&!f)return null;
          const displayName=isCat?item.name:(item.label||f.name.replace(/\.[^.]+$/,''));
          const isOver=overIdx===idx;
          const isRenaming=renaming?.id===item.id;
          const rot=item.rotation||0;
          return(
            <div key={item.id}
              draggable={!isRenaming}
              onDragStart={e=>{if(isRenaming){e.preventDefault();return;}setDragIdx(idx);}}
              onDragEnd={()=>{setDragIdx(null);setOverIdx(null);}}
              onDragOver={e=>{if(isRenaming)return;e.preventDefault();setOverIdx(idx);}}
              onDrop={e=>{if(isRenaming)return;e.preventDefault();reorder(dragIdx,idx);setDragIdx(null);setOverIdx(null);}}
              onDoubleClick={()=>startRename(item)}
              style={{padding:'6px 8px',background:isCat?T.goldTint:T.surface,border:`1px solid ${isOver?T.gold:isCat?T.goldSoft:T.lineSoft}`,borderLeft:`3px solid ${isOver?T.gold:isCat?T.goldSoft:T.lineSoft}`,borderRadius:6,cursor:isRenaming?'default':'grab',userSelect:isRenaming?'text':'none'}}
            >
              {/* Main row */}
              <div style={{display:'grid',gridTemplateColumns:'14px 26px 1fr auto',alignItems:'center',gap:7}}>
                <Icon name="move" size={10} color={T.ink5}/>
                <div style={{width:26,height:26,borderRadius:3,background:isCat?'#fff':T.panel2,display:'grid',placeItems:'center',flexShrink:0}}>
                  <Icon name={isCat?'bookmark':f.type==='pdf'?'pdf':'image'} size={13} color={isCat?T.gold:T.ink3}/>
                </div>
                <div style={{minWidth:0}}>
                  {isRenaming?(
                    <input autoFocus value={renaming.val}
                      onChange={e=>setRenaming(r=>({...r,val:e.target.value}))}
                      onBlur={commitRename}
                      onKeyDown={e=>{if(e.key==='Enter')commitRename();if(e.key==='Escape')setRenaming(null);}}
                      onClick={e=>e.stopPropagation()}
                      style={{width:'100%',border:`1px solid ${T.gold}`,borderRadius:3,padding:'1px 5px',fontSize:11.5,fontFamily:'inherit',outline:'none',boxSizing:'border-box'}}
                    />
                  ):(
                    <div style={{fontSize:11.5,fontWeight:isCat?600:400,color:T.ink,overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis'}} title="Double-clic pour renommer">{displayName}</div>
                  )}
                  <div style={{fontSize:10,color:T.ink4}}>
                    {isCat?'Catégorie':`${f.pages}p · ${f.size}`}
                  </div>
                </div>
                <button onClick={e=>{e.stopPropagation();handleDelete(item.id);}}
                  style={{background:'transparent',border:'none',padding:'3px',cursor:'pointer',borderRadius:4,display:'grid',placeItems:'center'}}>
                  <Icon name="trash" size={12} color={T.ink4}/>
                </button>
              </div>
              {/* Rotation row — only for files */}
              {!isCat&&(
                <div style={{display:'flex',alignItems:'center',gap:4,marginTop:5,paddingLeft:47}}>
                  <Icon name="rotateCW" size={10} color={T.ink5}/>
                  <span style={{fontSize:9,color:T.ink5,marginRight:2}}>Rotation</span>
                  {[0,90,180,270].map(deg=>(
                    <button key={deg} onClick={e=>{e.stopPropagation();setRotation(item.id,deg);}} style={rotBtnSt(rot===deg)}>{deg}°</button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Sect>
  </>;
}
function BackPanel({state,update}) {
  return <Sect title="Page finale">
    <Fld label="Texte décoratif"><input style={inputSt} value={state.backDecor} onChange={e=>update({backDecor:e.target.value})}/></Fld>
    {state.backLines.map((l,i)=><Fld key={i} label={`Ligne ${i+1}`}><input style={inputSt} value={l} onChange={e=>{const lines=[...state.backLines];lines[i]=e.target.value;update({backLines:lines});}}/></Fld>)}
  </Sect>;
}
function SignPanel({state,update}) {
  return <>
    <Sect title="Signature">
      <div style={{border:`1.5px dashed ${T.lineStrong}`,borderRadius:8,padding:18,textAlign:'center',background:T.panel,display:'flex',flexDirection:'column',alignItems:'center',gap:6,cursor:'pointer'}}>
        <Icon name="signature" size={22} color={T.gold}/><strong style={{fontSize:12.5,color:T.ink}}>Chargez votre signature</strong>
      </div>
      <RowItem label="Activer la signature" sub="Apposée sur l'export"><Toggle checked={state.sigEnabled} onChange={v=>update({sigEnabled:v})}/></RowItem>
    </Sect>
    <Sect title="Filigrane">
      <RowItem label="Filigrane" sub="Texte diagonal en transparence"><Toggle checked={state.wmEnabled} onChange={v=>update({wmEnabled:v})}/></RowItem>
      {state.wmEnabled&&<Fld label={`Opacité ${state.wmOpacity}%`}><input type="range" min="5" max="60" value={state.wmOpacity} onChange={e=>update({wmOpacity:parseInt(e.target.value)})} style={{width:'100%',accentColor:T.navy}}/></Fld>}
    </Sect>
  </>;
}
function SymbolsPanel() {
  return <Sect title="Bibliothèque">
    <div style={{padding:'10px 12px',background:T.panel,border:`1px solid ${T.line}`,borderRadius:8,fontSize:12,color:T.ink3}}>Activez un symbole et glissez-le sur la page.</div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6}}>
      {['star','check','warning','shield','sparkle','bookmark','info','globe'].map(n=><button key={n} style={{aspectRatio:1,background:T.panel,border:`1px solid ${T.lineSoft}`,borderRadius:6,display:'grid',placeItems:'center',cursor:'pointer'}}><Icon name={n} size={20} color={T.navy}/></button>)}
    </div>
  </Sect>;
}

function StepPanel({step,state,update,updateNested}) {
  switch(step){
    case 'project': return <ProjectPanel  state={state} update={update}/>;
    case 'palette': return <PalettePanel  state={state} update={update} updateNested={updateNested}/>;
    case 'format':  return <FormatPanel   state={state} update={update}/>;
    case 'cover':   return <CoverPanel    state={state} update={update}/>;
    case 'index':   return <IndexPanel    state={state} update={update}/>;
    case 'mat':     return <MaterialsPanel state={state} update={update}/>;
    case 'notes':   return <NotesPanel    state={state} update={update}/>;
    case 'content': return <ContentPanel  state={state} update={update}/>;
    case 'back':    return <BackPanel     state={state} update={update}/>;
    case 'sign':    return <SignPanel     state={state} update={update}/>;
    case 'sym':     return <SymbolsPanel/>;
    default: return null;
  }
}

function Rail({steps,active,state,compl,onPick}) {
  const activeGroup=steps.find(s=>s.id===active)?.group;
  const hasActive=!!active;
  return <aside style={{width:210,flexShrink:0,background:'#F7F4EE',borderRight:`1px solid ${T.line}`,overflowY:'auto',padding:'16px 0 24px',display:'flex',flexDirection:'column'}}>
    {STEP_GROUPS.map(g=>{
      const isActiveGroup=g===activeGroup;
      return <div key={g} style={{marginBottom:4,opacity:hasActive&&!isActiveGroup?0.3:1,transition:'opacity .25s'}}>
        <div style={{fontSize:9,letterSpacing:'.18em',fontWeight:700,textTransform:'uppercase',color:isActiveGroup?T.navy:T.ink4,padding:'10px 16px 5px',transition:'color .2s'}}>{g}</div>
        {isActiveGroup&&<div style={{margin:'0 10px 4px',height:2,borderRadius:999,background:`linear-gradient(90deg,${T.navy},transparent)`}}/>}
        {steps.filter(s=>s.group===g).map(s=>{
          const idx=steps.findIndex(x=>x.id===s.id)+1;
          const isOn=s.id===active,isDone=compl[s.id]==='done';
          return <button key={s.id} onClick={()=>onPick(s.id)} style={{display:'flex',alignItems:'center',gap:10,padding:isOn?'9px 0 9px 14px':'7px 8px 7px 14px',cursor:'pointer',border:'none',background:isOn?T.surface:isActiveGroup&&!isOn?'rgba(255,255,255,.45)':'transparent',borderLeft:`3px solid ${isOn?T.navy:isActiveGroup&&!isOn?T.lineSoft:'transparent'}`,marginRight:isOn?-1:0,boxShadow:isOn?'2px 0 0 #fff, 0 2px 12px rgba(15,31,71,.07)':undefined,transition:'background .15s',userSelect:'none',position:'relative',zIndex:isOn?3:1,width:'100%',fontFamily:'inherit',textAlign:'left'}}>
            <div style={{width:22,height:22,borderRadius:'50%',flexShrink:0,background:isOn?T.navy:isDone?T.success:'transparent',border:`1.5px solid ${isOn?T.navy:isDone?T.success:T.lineStrong}`,display:'grid',placeItems:'center',fontSize:10,fontWeight:700,color:isOn||isDone?'#fff':T.ink4}}>
              {isDone&&!isOn?<Icon name="check" size={11} stroke={2.5} color="#fff"/>:idx}
            </div>
            <Icon name={s.icon} size={14} color={isOn?T.navy:isDone&&!isOn?T.success:T.ink4} style={{flexShrink:0}}/>
            <div style={{minWidth:0,flex:1}}>
              <div style={{fontSize:12.5,fontWeight:isOn?700:500,color:isOn?T.ink:T.ink3,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{s.label}</div>
              <div style={{fontSize:10,color:isOn?T.ink4:T.ink5,marginTop:1,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{s.sub}</div>
            </div>
            {isDone&&!isOn&&<div style={{width:6,height:6,borderRadius:'50%',background:T.success,flexShrink:0,marginRight:8}}/>}
          </button>;
        })}
      </div>;
    })}
    <div style={{marginTop:'auto',padding:'16px 12px 4px'}}>
      <div style={{background:T.navyTint,border:`1px solid #D2DBEC`,borderRadius:8,padding:'10px 12px',display:'flex',flexDirection:'column',gap:4}}>
        <div style={{display:'flex',gap:6,alignItems:'center'}}><Icon name="cloud" size={13} color={T.navy}/><span style={{fontSize:11,color:T.navy,fontWeight:700}}>Synchronisé</span></div>
        <div style={{fontSize:10,color:T.ink3,lineHeight:1.4}}>Projet enregistré dans votre espace.</div>
      </div>
    </div>
  </aside>;
}

const STEP_DESC={
  project:"Identifiez le client et chargez son logo.",palette:"Trois couleurs définissent l'identité visuelle.",
  format:"Choisissez le format papier et la disposition.",cover:"La couverture est la première impression.",
  index:"Le sommaire est généré automatiquement.",mat:"Jusqu'à 36 vignettes matériaux/finitions.",
  notes:"Ajoutez des pages blanches pour annoter.",content:"Glissez PDF et images. Organisez par catégories.",
  back:"La 4ᵉ de couverture : coordonnées entreprise.",sign:"Signature et filigrane optionnel.",sym:"Bibliothèque de pictogrammes.",
};

function Inspector({step,state,update,updateNested}) {
  const meta=STEPS.find(s=>s.id===step)||STEPS[0];
  const stepIndex=STEPS.findIndex(s=>s.id===step)+1;
  return <section style={{width:340,flexShrink:0,background:T.surface,borderRight:`1px solid ${T.line}`,overflowY:'auto',display:'flex',flexDirection:'column'}}>
    <div style={{padding:'20px 22px 14px',borderBottom:`1px solid ${T.lineSoft}`,background:T.surface,position:'sticky',top:0,zIndex:5}}>
      <div style={{display:'flex',alignItems:'center',gap:10}}>
        <div style={{width:22,height:22,borderRadius:'50%',background:T.navy,color:'#fff',display:'grid',placeItems:'center',fontSize:10.5,fontWeight:700,flexShrink:0}}>{stepIndex}</div>
        <Icon name={meta.icon} size={18} color={T.navy}/>
        <h2 style={{fontSize:16,fontWeight:600,color:T.ink,margin:0}}>{meta.label}</h2>
      </div>
      <p style={{fontSize:12,color:T.ink3,lineHeight:1.5,margin:'6px 0 0'}}>{STEP_DESC[step]}</p>
    </div>
    <div style={{padding:'16px 22px 60px',display:'flex',flexDirection:'column',gap:18}}>
      <StepPanel step={step} state={state} update={update} updateNested={updateNested}/>
    </div>
  </section>;
}

function VueEnsembleModal({state,update,onClose}) {
  const [vueSize,setVueSize]=useState('M');
  const [localOrder,setLocalOrder]=useState(state.contentOrder);
  const [renamingId,setRenamingId]=useState(null);
  const [renameVal,setRenameVal]=useState('');
  const [dragCoIdx,setDragCoIdx]=useState(null);
  const [overCoIdx,setOverCoIdx]=useState(null);

  const stateL=useMemo(()=>({...state,contentOrder:localOrder}),[state,localOrder]);

  const enriched=useMemo(()=>{
    const s=stateL,pages=[];
    pages.push({key:'cover',type:'cover',label:'Couverture',coIdx:-1});
    if(s.enIdx){
      const n=s.contentOrder.filter(it=>it.type==='cat'||(s.idxMode!=='cats'&&s.files.find(x=>x.id===it.fileId))).length;
      for(let i=0;i<Math.max(1,Math.ceil(n/40));i++) pages.push({key:'idx'+i,type:'index',label:'Sommaire',pageIndex:i,coIdx:-1});
    }
    if(s.enMat){
      const isP=s.pageFormat.startsWith('v'),pp=(isP?4:6)*(isP?4:3);
      for(let i=0;i<(s.thumbCount>pp?2:1);i++) pages.push({key:'mat'+i,type:'materials',label:'Matériaux',pageIndex:i,coIdx:-1});
    }
    if(s.enNotes) pages.push({key:'notes0',type:'notes',label:'Notes',coIdx:-1});
    s.contentOrder.forEach((it,coIdx)=>{
      if(it.type==='cat'){pages.push({key:'cat-'+it.id,type:'category',label:it.name,catName:it.name,coIdx});}
      else{const f=s.files.find(x=>x.id===it.fileId);if(!f)return;for(let i=0;i<(f.pages||1);i++) pages.push({key:'f-'+it.id+'-'+i,type:'content',label:f.name.replace(/\.[^.]+$/,''),file:f,pageIdx:i,coIdx});}
    });
    pages.push({key:'back',type:'back',label:'Quatrième de couverture',coIdx:-1});
    return pages;
  },[stateL]);

  const VH={SX:46,S:66,M:90,L:124,XL:168};
  const thumbH=VH[vueSize];
  const isP=state.pageFormat.startsWith('v');
  const ratio=isP?210/297:297/210;
  const thumbW=Math.round(thumbH*ratio);
  const REF_W=isP?700:1000;
  const scale=thumbW/REF_W;

  const startRename=it=>{setRenamingId(it.id);setRenameVal(it.name);};
  const commitRename=()=>{
    if(renamingId&&renameVal.trim()) setLocalOrder(o=>o.map(it=>it.id===renamingId?{...it,name:renameVal.trim()}:it));
    setRenamingId(null);
  };
  const reorder=(from,to)=>{
    if(from===to||from===null||to===null)return;
    const a=[...localOrder];
    const [item]=a.splice(from,1);
    a.splice(from<to?Math.min(to-1,a.length):to,0,item);
    setLocalOrder(a);
  };
  const apply=()=>{update({contentOrder:localOrder});onClose();};

  return <Scrim onClose={onClose}><div style={{
    width:'92vw',maxWidth:1300,maxHeight:'90vh',background:T.surface,
    borderRadius:16,display:'flex',flexDirection:'column',
    boxShadow:'0 32px 80px rgba(0,0,0,.3)',border:`1px solid ${T.line}`,overflow:'hidden'
  }} onClick={e=>e.stopPropagation()}>

    {/* ── Header */}
    <div style={{display:'flex',alignItems:'center',gap:12,padding:'11px 18px',borderBottom:`1px solid ${T.lineSoft}`,flexShrink:0}}>
      <Icon name="grid" size={16} color={T.navy}/>
      <span style={{fontSize:15,fontWeight:600,color:T.ink}}>Vue ensemble</span>
      <span style={{...pillSt(),fontSize:10}}>{enriched.length} pages</span>
      <div style={{flex:1}}/>
      <div style={{display:'inline-flex',gap:2,background:T.panel2,borderRadius:6,padding:2}}>
        {['SX','S','M','L','XL'].map(s=>(
          <button key={s} onClick={()=>setVueSize(s)} style={{
            background:vueSize===s?T.navy:'transparent',border:'none',
            color:vueSize===s?'#fff':T.ink3,borderRadius:4,padding:'3px 10px',
            fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:'inherit',transition:'.12s'
          }}>{s}</button>
        ))}
      </div>
      <button onClick={onClose} style={{background:'transparent',border:`1px solid ${T.line}`,borderRadius:6,padding:'5px 8px',cursor:'pointer',display:'flex',alignItems:'center',marginLeft:4}}>
        <Icon name="close" size={15} color={T.ink3}/>
      </button>
    </div>

    {/* ── Pages grid */}
    <div style={{flex:1,overflowY:'auto',padding:18,display:'flex',flexWrap:'wrap',gap:10,alignContent:'flex-start'}}
      onDragOver={e=>e.preventDefault()}
      onDrop={e=>{e.preventDefault();setDragCoIdx(null);setOverCoIdx(null);}}>
      {enriched.map((page,i)=>{
        const isFixed=page.coIdx<0;
        const isDraggable=!isFixed;
        const isCat=page.type==='category';
        const isDragging=isDraggable&&dragCoIdx===page.coIdx;
        const isOver=isDraggable&&overCoIdx===page.coIdx&&dragCoIdx!==null&&dragCoIdx!==page.coIdx;
        const coItem=isDraggable?localOrder[page.coIdx]:null;
        const isRenaming=isCat&&coItem&&renamingId===coItem.id;
        const numSz=Math.min(10,Math.max(6,Math.round(thumbH*0.09)));
        return (
          <div key={page.key}
            draggable={isDraggable}
            onDragStart={e=>{if(isDraggable){setDragCoIdx(page.coIdx);e.dataTransfer.effectAllowed='move';}}}
            onDragOver={e=>{e.preventDefault();e.stopPropagation();if(isDraggable)setOverCoIdx(page.coIdx);}}
            onDragLeave={e=>{if(!e.currentTarget.contains(e.relatedTarget))setOverCoIdx(null);}}
            onDrop={e=>{e.preventDefault();e.stopPropagation();if(isDraggable){reorder(dragCoIdx,page.coIdx);setDragCoIdx(null);setOverCoIdx(null);}}}
            onDragEnd={()=>{setDragCoIdx(null);setOverCoIdx(null);}}
            style={{display:'flex',flexDirection:'column',alignItems:'center',gap:5,opacity:isDragging?.28:1,cursor:isDraggable?'grab':'default',position:'relative',transition:'opacity .15s'}}
          >
            {isOver&&<div style={{position:'absolute',left:-7,top:0,bottom:14,width:3,background:T.navy,borderRadius:2,zIndex:10}}/>}
            <div style={{
              width:thumbW,height:thumbH,overflow:'hidden',borderRadius:3,position:'relative',
              border:`1.5px solid ${isOver?T.navy:isCat?T.goldSoft:isFixed?T.lineSoft:T.line}`,
              boxShadow:isOver?`0 0 0 2px ${T.navyTint}`:isCat?`0 0 0 1px rgba(184,149,86,.2)`:'none',
              background:'#fff',transition:'border-color .12s,box-shadow .12s'
            }}>
              <div style={{position:'absolute',top:2,left:2,zIndex:3,background:'rgba(0,0,0,.4)',color:'#fff',fontSize:numSz,fontWeight:700,padding:'0.5px 3px',borderRadius:1.5,letterSpacing:'.04em',pointerEvents:'none'}}>{i+1}</div>
              {isFixed&&<div style={{position:'absolute',top:2,right:2,zIndex:3,background:'rgba(0,0,0,.3)',borderRadius:2,padding:2,pointerEvents:'none'}}><Icon name="lock" size={Math.max(6,Math.round(thumbH*.08))} color="rgba(255,255,255,.85)"/></div>}
              {isDraggable&&<div style={{position:'absolute',bottom:2,right:2,zIndex:3,background:'rgba(255,255,255,.72)',borderRadius:2,padding:2,pointerEvents:'none'}}><Icon name="move" size={Math.max(6,Math.round(thumbH*.08))} color={T.ink3}/></div>}
              <div style={{width:REF_W,transformOrigin:'top left',transform:`scale(${scale})`,pointerEvents:'none'}}>
                <PageRender page={page} state={stateL}/>
              </div>
            </div>
            {isRenaming
              ?<input autoFocus value={renameVal} onChange={e=>setRenameVal(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={e=>{if(e.key==='Enter')commitRename();if(e.key==='Escape')setRenamingId(null);}}
                  style={{width:Math.max(thumbW,60),fontSize:9,textAlign:'center',border:`1px solid ${T.navy}`,borderRadius:3,padding:'2px 4px',fontFamily:'inherit',outline:'none',color:T.ink,background:'#fff'}}
                  onClick={e=>e.stopPropagation()}/>
              :<div title={isCat?'Double-cliquer pour renommer':undefined}
                  onDoubleClick={isCat&&coItem?()=>startRename(coItem):undefined}
                  style={{fontSize:9,color:isCat?T.navy:isFixed?T.ink4:T.ink3,maxWidth:Math.max(thumbW,50),overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',textAlign:'center',fontWeight:isCat?600:400,cursor:isCat?'text':'default',userSelect:'none',display:'flex',alignItems:'center',gap:3}}>
                <span style={{overflow:'hidden',textOverflow:'ellipsis'}}>{page.label}</span>
                {isCat&&<Icon name="pencil" size={8} color={T.ink4}/>}
              </div>
            }
          </div>
        );
      })}
    </div>

    {/* ── Footer */}
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 18px',borderTop:`1px solid ${T.lineSoft}`,flexShrink:0,background:T.panel}}>
      <div style={{fontSize:11,color:T.ink3,display:'flex',alignItems:'center',gap:6}}>
        <Icon name="info" size={13} color={T.ink4}/>
        Glissez pour réorganiser · Double-cliquez sur une catégorie pour renommer
      </div>
      <div style={{display:'flex',gap:8}}>
        <button style={btnSt()} onClick={onClose}>Annuler</button>
        <button style={btnSt('primary')} onClick={apply}><Icon name="check" size={13} color="#fff"/>Appliquer</button>
      </div>
    </div>
  </div></Scrim>;
}

function ThumbnailPalette({state,activePage,onPageClick,thumbSize,setThumbSize,onOpenVueEnsemble,collapsed,setCollapsed}) {
  const stripRef=useRef(null);
  const pages=useMemo(()=>buildPageList(state),[state]);
  const isPortrait=state.pageFormat.startsWith('v');

  const THUMB_H={S:55,M:78,L:106};
  const thumbH=THUMB_H[thumbSize];
  const ratio=isPortrait?(210/297):(297/210);
  const thumbW=Math.round(thumbH*ratio);
  const REF_W=isPortrait?700:1000;
  const scale=thumbW/REF_W;

  useEffect(()=>{
    if(!stripRef.current)return;
    const el=stripRef.current.children[activePage];
    if(el) el.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'});
  },[activePage]);

  const navBtnSt={background:'transparent',border:'none',cursor:'pointer',padding:'2px 5px',display:'flex',alignItems:'center',borderRadius:3,transition:'.12s'};

  return (
    <div style={{flexShrink:0,background:'#18202E',borderTop:'1px solid rgba(255,255,255,.1)',display:'flex',flexDirection:'column'}}>
      {/* ── Toolbar */}
      <div style={{display:'flex',alignItems:'center',gap:6,padding:'5px 10px',borderBottom:'1px solid rgba(255,255,255,.08)',flexShrink:0}}>
        <Icon name="layers" size={12} color="rgba(255,255,255,.4)"/>
        <span style={{fontSize:9.5,color:'rgba(255,255,255,.4)',letterSpacing:'.12em',textTransform:'uppercase',fontWeight:600}}>{pages.length} pages</span>
        <div style={{flex:1}}/>

        {/* First / last page */}
        <button style={navBtnSt} title="Première page" onClick={()=>onPageClick(0)}>
          <Icon name="pageTop" size={14} color="rgba(255,255,255,.55)"/>
        </button>
        <button style={navBtnSt} title="Dernière page" onClick={()=>onPageClick(pages.length-1)}>
          <Icon name="pageBot" size={14} color="rgba(255,255,255,.55)"/>
        </button>

        <div style={{width:1,height:12,background:'rgba(255,255,255,.14)',margin:'0 3px'}}/>

        {/* Vue ensemble */}
        <button onClick={onOpenVueEnsemble} style={{
          background:'rgba(255,255,255,.09)',border:'1px solid rgba(255,255,255,.16)',
          color:'rgba(255,255,255,.82)',borderRadius:4,padding:'2px 9px',
          fontSize:10,fontWeight:600,cursor:'pointer',fontFamily:'inherit',
          display:'flex',alignItems:'center',gap:4,letterSpacing:'.03em',transition:'.12s'
        }}>
          <Icon name="grid" size={11} color="rgba(255,255,255,.82)"/>Vue ensemble
        </button>

        <div style={{width:1,height:12,background:'rgba(255,255,255,.14)',margin:'0 3px'}}/>

        {/* Size selector */}
        <div style={{display:'inline-flex',gap:2,background:'rgba(255,255,255,.07)',borderRadius:5,padding:2}}>
          {['S','M','L'].map(s=>(
            <button key={s} onClick={()=>setThumbSize(s)} style={{
              background:thumbSize===s?'rgba(255,255,255,.18)':'transparent',
              border:'none',color:thumbSize===s?'#fff':'rgba(255,255,255,.35)',
              borderRadius:3,padding:'2px 9px',fontSize:10.5,fontWeight:600,
              cursor:'pointer',fontFamily:'inherit',transition:'.12s',letterSpacing:'.04em'
            }}>{s}</button>
          ))}
        </div>

        <div style={{width:1,height:12,background:'rgba(255,255,255,.14)',margin:'0 3px'}}/>
        <button onClick={()=>setCollapsed(c=>!c)} style={navBtnSt} title={collapsed?'Afficher les miniatures':'Réduire'}>
          <Icon name="chevD" size={13} color="rgba(255,255,255,.55)" style={{transform:collapsed?'rotate(180deg)':'none',transition:'transform .2s'}}/>
        </button>
      </div>

      {/* ── Thumbnail strip */}
      {!collapsed&&<div ref={stripRef} style={{
        display:'flex',alignItems:'flex-end',gap:8,
        padding:'9px 14px 10px',overflowX:'auto',overflowY:'hidden',
        scrollbarWidth:'thin',scrollbarColor:'rgba(255,255,255,.15) transparent'
      }}>
        {pages.map((page,i)=>{
          const isActive=activePage===i;
          return (
            <div key={page.key} onClick={()=>onPageClick(i)} style={{
              flexShrink:0,display:'flex',flexDirection:'column',
              alignItems:'center',gap:4,cursor:'pointer'
            }}>
              <div style={{
                width:thumbW,height:thumbH,overflow:'hidden',
                borderRadius:2,position:'relative',
                border:`1.5px solid ${isActive?T.gold:'rgba(255,255,255,.18)'}`,
                boxShadow:isActive?`0 0 0 2px rgba(184,149,86,.35)`:'none',
                transform:isActive?'translateY(-2px)':'none',
                transition:'transform .15s, border-color .15s, box-shadow .15s',
                background:'#fff'
              }}>
                <div style={{
                  fontSize:6.5,fontWeight:700,position:'absolute',top:2,right:2,zIndex:2,
                  background:'rgba(0,0,0,.4)',color:'#fff',
                  padding:'0.5px 3px',borderRadius:1.5,letterSpacing:'.04em',
                  pointerEvents:'none'
                }}>{i+1}</div>
                <div style={{
                  width:REF_W,transformOrigin:'top left',
                  transform:`scale(${scale})`,pointerEvents:'none'
                }}>
                  <PageRender page={page} state={state}/>
                </div>
              </div>
              <div style={{
                fontSize:8.5,
                color:isActive?T.gold:'rgba(255,255,255,.35)',
                maxWidth:Math.max(thumbW,50),
                overflow:'hidden',textOverflow:'ellipsis',
                whiteSpace:'nowrap',textAlign:'center',
                letterSpacing:'.03em',transition:'color .15s'
              }}>{page.label}</div>
            </div>
          );
        })}
      </div>}
    </div>
  );
}

// ── ANNOTATOR MODAL ───────────────────────────────────────────
function AnnotatorModal({state,update,pageKey,pageUrl,isPortrait,onClose}) {
  const canvasElRef=useRef(null);
  const fc=useRef(null);
  const toolRef=useRef('select');
  const colorRef=useRef('#E53E3E');
  const strokeWRef=useRef(2);
  const isLoadingRef=useRef(false);
  const shapeRef=useRef(null);
  const isDrawingRef=useRef(false);
  const originRef=useRef({x:0,y:0});
  const histRef=useRef([]);
  const histIdxRef=useRef(-1);

  const [tool,setToolState]=useState('select');
  const [color,setColorState]=useState('#E53E3E');
  const [strokeW,setStrokeWState]=useState(2);
  const [textPrompt,setTextPrompt]=useState(null);
  const [textVal,setTextVal]=useState('');
  const [canUndo,setCanUndo]=useState(false);
  const [canRedo,setCanRedo]=useState(false);

  const setTool=t=>{toolRef.current=t;setToolState(t);};
  const setColor=c=>{colorRef.current=c;setColorState(c);};
  const setStrokeW=w=>{strokeWRef.current=w;setStrokeWState(w);};

  const ratio=isPortrait?(210/297):(297/210);
  const CW=isPortrait?560:840;
  const CH=Math.round(CW/ratio);

  const updHist=()=>{setCanUndo(histIdxRef.current>0);setCanRedo(histIdxRef.current<histRef.current.length-1);};

  const pushHist=canvas=>{
    if(isLoadingRef.current)return;
    const objs=canvas.getObjects().map(o=>o.toObject(['selectable','evented']));
    const h=histRef.current.slice(0,histIdxRef.current+1);
    h.push(JSON.stringify(objs));
    if(h.length>30)h.shift();else histIdxRef.current++;
    histRef.current=h;
    updHist();
  };

  const restoreHist=(canvas,idx)=>{
    if(idx<0||idx>=histRef.current.length)return;
    isLoadingRef.current=true;
    const objs=JSON.parse(histRef.current[idx]);
    canvas.getObjects().slice().forEach(o=>canvas.remove(o));
    if(objs.length===0){canvas.requestRenderAll();isLoadingRef.current=false;}
    else{window.fabric.util.enlivenObjects(objs,en=>{en.forEach(o=>canvas.add(o));canvas.requestRenderAll();isLoadingRef.current=false;});}
    histIdxRef.current=idx;
    updHist();
  };

  useEffect(()=>{
    if(!window.fabric||!canvasElRef.current)return;
    const canvas=new window.fabric.Canvas(canvasElRef.current,{width:CW,height:CH,preserveObjectStacking:true,selection:true});
    fc.current=canvas;

    // Background
    if(pageUrl){
      window.fabric.Image.fromURL(pageUrl,img=>{
        const sc=Math.max(CW/img.width,CH/img.height);
        img.set({scaleX:sc,scaleY:sc,originX:'left',originY:'top',left:0,top:0});
        canvas.setBackgroundImage(img,()=>canvas.requestRenderAll());
      },{crossOrigin:'anonymous'});
    } else {
      canvas.setBackgroundColor('#F0EBE0',()=>canvas.requestRenderAll());
    }

    // Saved annotations
    const saved=state.annotations?.[pageKey];
    if(saved){
      try{
        isLoadingRef.current=true;
        window.fabric.util.enlivenObjects(JSON.parse(saved),en=>{
          en.forEach(o=>canvas.add(o));
          canvas.requestRenderAll();
          isLoadingRef.current=false;
          pushHist(canvas);
        });
      }catch(e){isLoadingRef.current=false;}
    } else {
      pushHist(canvas);
    }

    canvas.on('object:added',()=>pushHist(canvas));
    canvas.on('object:modified',()=>pushHist(canvas));
    canvas.on('object:removed',()=>pushHist(canvas));

    // Mouse handlers (read tool/color/stroke via refs to avoid stale closures)
    canvas.on('mouse:down',opt=>{
      const t=toolRef.current;
      if(t==='select'||t==='pencil'||t==='text')return;
      isDrawingRef.current=true;
      const p=canvas.getPointer(opt.e);
      originRef.current={x:p.x,y:p.y};
      const col=colorRef.current,sw=strokeWRef.current*2;
      if(t==='line'||t==='underline'){
        shapeRef.current=new window.fabric.Line([p.x,p.y,p.x,p.y],{stroke:col,strokeWidth:sw,strokeLineCap:'round',selectable:false,evented:false});
        canvas.add(shapeRef.current);
      } else if(t==='rect'||t==='rectText'){
        shapeRef.current=new window.fabric.Rect({left:p.x,top:p.y,width:1,height:1,fill:'white',stroke:col,strokeWidth:strokeWRef.current,rx:2,ry:2,selectable:false,evented:false});
        canvas.add(shapeRef.current);
      } else if(t==='circle'){
        shapeRef.current=new window.fabric.Ellipse({left:p.x,top:p.y,rx:1,ry:1,fill:'transparent',stroke:col,strokeWidth:strokeWRef.current,selectable:false,evented:false});
        canvas.add(shapeRef.current);
      } else if(t==='triangle'){
        shapeRef.current=new window.fabric.Triangle({left:p.x,top:p.y,width:1,height:1,fill:'transparent',stroke:col,strokeWidth:strokeWRef.current,selectable:false,evented:false});
        canvas.add(shapeRef.current);
      }
      canvas.requestRenderAll();
    });

    canvas.on('mouse:move',opt=>{
      if(!isDrawingRef.current||!shapeRef.current)return;
      const p=canvas.getPointer(opt.e),o=originRef.current,t=toolRef.current;
      if(t==='line') shapeRef.current.set({x2:p.x,y2:p.y});
      else if(t==='underline') shapeRef.current.set({x2:p.x,y2:o.y});
      else if(t==='circle'){
        const rx=Math.max(1,Math.abs(p.x-o.x)/2),ry=Math.max(1,Math.abs(p.y-o.y)/2);
        shapeRef.current.set({left:Math.min(p.x,o.x),top:Math.min(p.y,o.y),rx,ry});
      } else if(t==='triangle'){
        shapeRef.current.set({left:p.x<o.x?p.x:o.x,top:p.y<o.y?p.y:o.y,width:Math.max(1,Math.abs(p.x-o.x)),height:Math.max(1,Math.abs(p.y-o.y))});
      } else{
        shapeRef.current.set({
          left:p.x<o.x?p.x:o.x,top:p.y<o.y?p.y:o.y,
          width:Math.max(1,Math.abs(p.x-o.x)),height:Math.max(1,Math.abs(p.y-o.y)),
        });
      }
      canvas.requestRenderAll();
    });

    canvas.on('mouse:up',opt=>{
      const t=toolRef.current;
      if(t==='text'){
        const p=canvas.getPointer(opt.e);
        const txt=new window.fabric.IText('Texte',{left:p.x,top:p.y,fontSize:18,fill:colorRef.current,fontFamily:'Arial'});
        canvas.add(txt);canvas.setActiveObject(txt);txt.enterEditing();txt.selectAll();
        return;
      }
      if(!isDrawingRef.current||!shapeRef.current)return;
      isDrawingRef.current=false;
      const shape=shapeRef.current;shapeRef.current=null;
      shape.set({selectable:true,evented:true});
      canvas.setActiveObject(shape);
      if(t==='rectText'){setTextPrompt(shape);setTextVal('');}
      canvas.requestRenderAll();
    });

    return ()=>canvas.dispose();
  },[]);

  useEffect(()=>{
    const canvas=fc.current;if(!canvas)return;
    canvas.isDrawingMode=tool==='pencil';
    if(tool==='pencil'){canvas.freeDrawingBrush.color=color;canvas.freeDrawingBrush.width=strokeW*2;}
    const isSel=tool==='select';
    canvas.selection=isSel;
    canvas.defaultCursor=isSel?'default':'crosshair';
    canvas.hoverCursor=isSel?'move':'crosshair';
    canvas.getObjects().forEach(o=>{o.selectable=isSel;o.evented=isSel;});
    canvas.requestRenderAll();
  },[tool]);

  useEffect(()=>{
    const canvas=fc.current;
    if(!canvas||tool!=='pencil')return;
    canvas.freeDrawingBrush.color=color;
    canvas.freeDrawingBrush.width=strokeW*2;
  },[color,strokeW,tool]);

  useEffect(()=>{
    const handler=e=>{
      if(e.key!=='Delete'&&e.key!=='Backspace')return;
      const canvas=fc.current;if(!canvas)return;
      const active=canvas.getActiveObject();
      if(active&&active.type==='i-text'&&active.isEditing)return;
      const objs=canvas.getActiveObjects();if(!objs.length)return;
      canvas.discardActiveObject();
      objs.forEach(o=>canvas.remove(o));
      canvas.requestRenderAll();
    };
    window.addEventListener('keydown',handler);
    return ()=>window.removeEventListener('keydown',handler);
  },[]);

  const undo=()=>restoreHist(fc.current,histIdxRef.current-1);
  const redo=()=>restoreHist(fc.current,histIdxRef.current+1);

  const rotateBy90=()=>{
    const canvas=fc.current;const o=canvas?.getActiveObject();
    if(!o)return;
    o.rotate((o.angle+90)%360);
    canvas.requestRenderAll();
  };

  const deleteSelected=()=>{
    const canvas=fc.current;
    const active=canvas.getActiveObjects();
    canvas.discardActiveObject();
    active.forEach(o=>canvas.remove(o));
    canvas.requestRenderAll();
  };

  const deleteAll=()=>{fc.current?.getObjects().slice().forEach(o=>fc.current.remove(o));fc.current?.requestRenderAll();};

  const bringFwd=()=>{const o=fc.current?.getActiveObject();if(o){fc.current.bringForward(o);fc.current.requestRenderAll();}};
  const sendBwd=()=>{const o=fc.current?.getActiveObject();if(o){fc.current.sendBackwards(o);fc.current.requestRenderAll();}};

  const commitRectText=()=>{
    if(!textPrompt||!textVal.trim()){setTextPrompt(null);return;}
    const rect=textPrompt;
    const rw=Math.max(rect.width||1,40),rh=Math.max(rect.height||1,24);
    fc.current.remove(rect);
    const newRect=new window.fabric.Rect({width:rw,height:rh,fill:'white',stroke:colorRef.current,strokeWidth:rect.strokeWidth||1,rx:2,ry:2});
    const txt=new window.fabric.IText(textVal.trim(),{
      fontSize:Math.max(10,Math.min(18,rh*0.45)),fill:'#1A1F2E',fontFamily:'Arial',
      textAlign:'center',originX:'center',originY:'center',left:rw/2,top:rh/2,width:rw-4,
    });
    const grp=new window.fabric.Group([newRect,txt],{left:rect.left,top:rect.top,selectable:true,evented:true});
    fc.current.add(grp);fc.current.setActiveObject(grp);fc.current.requestRenderAll();
    setTextPrompt(null);setTextVal('');
  };

  const save=()=>{
    const canvas=fc.current;
    const objs=canvas.getObjects();
    const newAnn={...(state.annotations||{})};
    const newSnap={...(state.annotSnaps||{})};
    if(objs.length===0){
      delete newAnn[pageKey];delete newSnap[pageKey];
    } else {
      newAnn[pageKey]=JSON.stringify(objs.map(o=>o.toObject(['selectable','evented'])));
      newSnap[pageKey]=canvas.toDataURL({format:'jpeg',quality:0.88});
    }
    update({annotations:newAnn,annotSnaps:newSnap});
    onClose();
  };

  const COLORS=['#E53E3E','#F6AD55','#48BB78','#4299E1','#9F7AEA','#1A1F2E','#FFFFFF'];
  const TOOLS=[
    {id:'select',   label:'Sélectionner',sym:'↖'},
    {id:'text',     label:'Texte',       sym:'T'},
    {id:'underline',label:'Souligner',   sym:'U̲'},
    {id:'line',     label:'Ligne',       sym:'╱'},
    {id:'rect',     label:'Cache blanc', sym:'□'},
    {id:'rectText', label:'Zone + texte',sym:'▣'},
    {id:'circle',   label:'Cercle',      sym:'○'},
    {id:'triangle', label:'Triangle',    sym:'△'},
    {id:'pencil',   label:'Crayon libre',sym:'✏'},
  ];
  const tbSt=act=>({display:'flex',alignItems:'center',gap:7,padding:'6px 10px',borderRadius:5,border:'none',cursor:'pointer',width:'100%',textAlign:'left',fontFamily:'inherit',fontSize:11.5,background:act?T.navy:'transparent',color:act?'#fff':'rgba(255,255,255,.7)',fontWeight:act?600:400});
  const aBtnSt=(danger,disabled)=>({...btnSt('ghost',true),color:danger?'#F87171':disabled?'rgba(255,255,255,.25)':'rgba(255,255,255,.82)',border:`1px solid ${danger?'rgba(248,113,113,.3)':disabled?'rgba(255,255,255,.08)':'rgba(255,255,255,.18)'}`,opacity:disabled?0.45:1,cursor:disabled?'not-allowed':'pointer'});

  return (
    <div style={{position:'fixed',inset:0,zIndex:500,background:'rgba(8,12,24,0.96)',display:'flex',flexDirection:'column',fontFamily:'inherit'}}>
      {/* ── Top bar */}
      <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 16px',background:'#0A1220',borderBottom:'1px solid rgba(255,255,255,.1)',flexShrink:0}}>
        <button onClick={save} style={{...btnSt('primary',true),minWidth:120}}><Icon name="save" size={13} color="#fff"/> Enregistrer</button>
        <button onClick={onClose} style={aBtnSt()}>Annuler</button>
        <div style={{flex:1,textAlign:'center',fontSize:10,color:'rgba(255,255,255,.3)',letterSpacing:'.14em',textTransform:'uppercase'}}>Mode Annotation</div>
        <div style={{display:'flex',gap:6,alignItems:'center'}}>
          <button onClick={undo} disabled={!canUndo} style={aBtnSt(false,!canUndo)}>↩ Annuler</button>
          <button onClick={redo} disabled={!canRedo} style={aBtnSt(false,!canRedo)}>↪ Rétablir</button>
          <div style={{width:1,height:18,background:'rgba(255,255,255,.12)',margin:'0 4px'}}/>
          <button onClick={deleteSelected} style={aBtnSt(true,false)}><Icon name="trash" size={12} color="#F87171"/> Supprimer</button>
          <button onClick={deleteAll} style={aBtnSt(true,false)}>Tout effacer</button>
        </div>
      </div>

      {/* ── Body */}
      <div style={{flex:1,display:'flex',overflow:'hidden',minHeight:0}}>
        {/* Left sidebar */}
        <div style={{width:150,background:'#0F1825',borderRight:'1px solid rgba(255,255,255,.07)',padding:'12px 8px',display:'flex',flexDirection:'column',gap:3,overflowY:'auto',flexShrink:0}}>
          <div style={{fontSize:9,color:'rgba(255,255,255,.28)',letterSpacing:'.12em',textTransform:'uppercase',padding:'0 6px',marginBottom:4}}>Outil</div>
          {TOOLS.map(t=>(
            <button key={t.id} onClick={()=>setTool(t.id)} style={tbSt(tool===t.id)}>
              <span style={{width:18,textAlign:'center',fontSize:13,flexShrink:0}}>{t.sym}</span>
              <span>{t.label}</span>
            </button>
          ))}
          <div style={{borderTop:'1px solid rgba(255,255,255,.08)',margin:'8px 0',paddingTop:8}}>
            <div style={{fontSize:9,color:'rgba(255,255,255,.28)',letterSpacing:'.12em',textTransform:'uppercase',padding:'0 6px',marginBottom:8}}>Couleur</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:5,padding:'0 4px'}}>
              {COLORS.map(c=>(
                <button key={c} onClick={()=>setColor(c)} style={{width:20,height:20,borderRadius:'50%',background:c,padding:0,border:`2px solid ${color===c?'#fff':c==='#FFFFFF'?'rgba(255,255,255,.25)':'transparent'}`,cursor:'pointer',outline:color===c?`2px solid ${T.gold}`:undefined,outlineOffset:1}}/>
              ))}
              <input type="color" value={color} onChange={e=>setColor(e.target.value)} title="Couleur libre" style={{width:20,height:20,border:'1px solid rgba(255,255,255,.2)',padding:0,cursor:'pointer',borderRadius:'50%',overflow:'hidden',background:'transparent'}}/>
            </div>
            <div style={{fontSize:9,color:'rgba(255,255,255,.28)',letterSpacing:'.12em',textTransform:'uppercase',padding:'0 6px',marginTop:10,marginBottom:4}}>Épaisseur · {strokeW}</div>
            <input type="range" min="1" max="8" value={strokeW} onChange={e=>setStrokeW(parseInt(e.target.value))} style={{width:'100%',accentColor:T.gold}}/>
          </div>
          <div style={{borderTop:'1px solid rgba(255,255,255,.08)',margin:'4px 0',paddingTop:8}}>
            <div style={{fontSize:9,color:'rgba(255,255,255,.28)',letterSpacing:'.12em',textTransform:'uppercase',padding:'0 6px',marginBottom:6}}>Rotation</div>
            <button onClick={rotateBy90} style={tbSt(false)}>↻ +90°</button>
          </div>
          <div style={{borderTop:'1px solid rgba(255,255,255,.08)',margin:'4px 0',paddingTop:8}}>
            <div style={{fontSize:9,color:'rgba(255,255,255,.28)',letterSpacing:'.12em',textTransform:'uppercase',padding:'0 6px',marginBottom:6}}>Calque</div>
            <button onClick={bringFwd} style={tbSt(false)}>↑ Premier plan</button>
            <button onClick={sendBwd} style={tbSt(false)}>↓ Arrière-plan</button>
          </div>
        </div>

        {/* Canvas area */}
        <div style={{flex:1,display:'grid',placeItems:'center',overflow:'auto',background:'#141E30',padding:20,position:'relative'}}>
          <div style={{position:'relative',lineHeight:0,boxShadow:'0 24px 80px rgba(0,0,0,.7)'}}>
            <canvas ref={canvasElRef}/>
            {textPrompt&&(
              <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.5)',display:'grid',placeItems:'center',zIndex:20}}>
                <div style={{background:'#fff',borderRadius:10,padding:20,minWidth:280,boxShadow:'0 12px 40px rgba(0,0,0,.5)'}}>
                  <div style={{fontSize:13,fontWeight:600,color:T.ink,marginBottom:10}}>Texte du rectangle</div>
                  <input autoFocus value={textVal} onChange={e=>setTextVal(e.target.value)}
                    onKeyDown={e=>{if(e.key==='Enter')commitRectText();if(e.key==='Escape')setTextPrompt(null);}}
                    style={{...inputSt,marginBottom:12}} placeholder="Saisissez le texte…"/>
                  <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
                    <button onClick={()=>setTextPrompt(null)} style={btnSt('ghost',true)}>Annuler</button>
                    <button onClick={commitRectText} style={btnSt('primary',true)}>Ajouter</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Configurator({user,project}) {
  const [state,setState]=useState(()=>initialState(project));
  const [activeStep,setActiveStep]=useState('project');
  const [dirtySteps,setDirtySteps]=useState({});
  const activeStepRef=React.useRef('project');
  const [toast,setToast]=useState(null);
  const [zoom,setZoom]=useState(1);
  const [activePage,setActivePage]=useState(0);
  const [thumbSize,setThumbSize]=useState('M');
  const [showVueEnsemble,setShowVueEnsemble]=useState(false);
  const [paletteCollapsed,setPaletteCollapsed]=useState(false);
  const [annotating,setAnnotating]=useState(null);
  const update=useCallback(patch=>{setState(s=>({...s,...patch,_dirty:true}));setDirtySteps(d=>({...d,[activeStepRef.current]:true}));},[]);
  const updateNested=useCallback((key,patch)=>{setState(s=>({...s,[key]:{...s[key],...patch},_dirty:true}));setDirtySteps(d=>({...d,[activeStepRef.current]:true}));},[]);
  const updatePageNotes=useCallback((pageKey,html)=>{setState(s=>({...s,pageNotes:{...(s.pageNotes||{}),[pageKey]:html},_dirty:true}));setDirtySteps(d=>({...d,content:true}));},[]);
  const showToast=m=>{setToast(m);setTimeout(()=>setToast(null),2400);};
  const save=()=>{setState(s=>({...s,_dirty:false}));showToast('Projet enregistré');};
  const compl=computeCompletion(state,dirtySteps);
  const PALETTE_H={S:99,M:122,L:150};
  const paletteH=paletteCollapsed?32:PALETTE_H[thumbSize];
  return <div style={{display:'flex',flex:1,overflow:'hidden',minHeight:0}}>
    <Rail steps={STEPS} active={activeStep} state={state} compl={compl} onPick={id=>{activeStepRef.current=id;setActiveStep(id);}}/>
    {activeStep&&<Inspector step={activeStep} state={state} update={update} updateNested={updateNested}/>}
    <div style={{flex:1,minWidth:0,display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <Canvas state={state} zoom={zoom} setZoom={setZoom} activePage={activePage}
        paletteH={paletteH}
        onAnnotate={p=>setAnnotating({pageKey:p.key,pageUrl:p.pageUrl,isPortrait:state.pageFormat.startsWith('v')})}
        onUpdatePageNotes={updatePageNotes}/>
      <ThumbnailPalette state={state} activePage={activePage} onPageClick={setActivePage}
        thumbSize={thumbSize} setThumbSize={setThumbSize}
        onOpenVueEnsemble={()=>setShowVueEnsemble(true)}
        collapsed={paletteCollapsed} setCollapsed={setPaletteCollapsed}/>
    </div>
    {state._dirty&&<div style={{position:'fixed',bottom:paletteH+16,left:'50%',transform:'translateX(-50%)',display:'flex',alignItems:'center',gap:8,background:'rgba(20,20,30,.92)',backdropFilter:'blur(20px)',borderRadius:999,padding:'6px 8px 6px 14px',zIndex:30,boxShadow:'0 8px 24px rgba(0,0,0,.22)'}}>
      <span style={{fontSize:11.5,color:'rgba(255,255,255,.6)'}}>Modifications non enregistrées</span>
      <button onClick={save} style={{background:T.surface,border:'none',color:T.ink,padding:'5px 12px',fontSize:12,borderRadius:999,display:'inline-flex',alignItems:'center',gap:5,fontWeight:600,cursor:'pointer'}}><Icon name="save" size={13} color={T.ink}/>Enregistrer</button>
    </div>}
    {toast&&<div style={{position:'fixed',bottom:paletteH+16,right:16,background:T.ink,color:'#fff',padding:'9px 14px',borderRadius:8,fontSize:12,zIndex:9999}}>{toast}</div>}
    {showVueEnsemble&&<VueEnsembleModal state={state} update={update} onClose={()=>setShowVueEnsemble(false)}/>}
    {annotating&&<AnnotatorModal state={state} update={update}
      pageKey={annotating.pageKey} pageUrl={annotating.pageUrl}
      isPortrait={annotating.isPortrait} onClose={()=>setAnnotating(null)}/>}
  </div>;
}

function TopBar({user,screen,project,onHome,onLogout}) {
  const [menuOpen,setMenuOpen]=useState(false);
  return <header style={{display:'flex',alignItems:'center',gap:14,padding:'0 14px 0 12px',background:T.surface,borderBottom:`1px solid ${T.line}`,height:56,flexShrink:0,position:'relative',zIndex:50}}>
    <button onClick={onHome} style={{display:'flex',alignItems:'center',gap:10,background:'transparent',border:'none',padding:0,cursor:'pointer'}}>
      <div style={{background:T.navy,borderRadius:4,padding:'5px 12px'}}><span style={{color:'#fff',fontWeight:900,fontSize:13,letterSpacing:2}}>ABRANE</span></div>
      <span style={{fontSize:11.5,color:T.ink3,borderLeft:`1px solid ${T.line}`,paddingLeft:10}}>Catalogue</span>
    </button>
    {screen!=='dashboard'&&<>
      <div style={{width:1,height:22,background:T.line}}/>
      <button style={{...btnSt('ghost',true),border:'none'}} onClick={onHome}><Icon name="back" size={14} color={T.ink2}/>Mes projets</button>
      <div style={{width:1,height:22,background:T.line}}/>
      <div style={{display:'inline-flex',alignItems:'center',gap:8,fontSize:13,fontWeight:600,color:T.ink}}><Icon name="doc" size={14} color={T.ink3}/>{project?.name||'Nouveau projet'}</div>
      <span style={{fontSize:10.5,color:T.ink3,padding:'2px 8px',border:`1px solid ${T.line}`,borderRadius:999,fontWeight:500}}><Icon name="cloud" size={11} color={T.success} style={{verticalAlign:'-2px',marginRight:4}}/>Enregistré</span>
    </>}
    <div style={{flex:1}}/>
    {screen==='configurator'&&<>
      <button style={btnSt(undefined,true)}><Icon name="eye" size={14} color={T.ink}/>Aperçu</button>
      <button style={btnSt('gold',true)}><Icon name="share" size={14} color={T.navy}/>Partager</button>
      <button style={btnSt('primary',true)}><Icon name="download" size={14} color="#fff"/>Exporter</button>
      <div style={{width:1,height:22,background:T.line}}/>
    </>}
    <div style={{position:'relative'}}>
      <button onClick={()=>setMenuOpen(o=>!o)} style={{display:'inline-flex',alignItems:'center',gap:8,padding:'4px 10px 4px 4px',borderRadius:999,border:`1px solid ${T.line}`,cursor:'pointer',background:'#fff'}}>
        <div style={{width:26,height:26,borderRadius:'50%',background:T.navy,color:'#fff',display:'grid',placeItems:'center',fontWeight:600,fontSize:11}}>{user.initials}</div>
        <span style={{fontSize:12,fontWeight:500,color:T.ink}}>{user.name.split(' ')[0]}</span>
        <Icon name="chevD" size={13} color={T.ink3}/>
      </button>
      {menuOpen&&<>
        <div style={{position:'fixed',inset:0,zIndex:60}} onClick={()=>setMenuOpen(false)}/>
        <div style={{position:'absolute',right:0,top:'calc(100% + 8px)',width:220,background:T.surface,border:`1px solid ${T.line}`,borderRadius:8,padding:8,zIndex:61,boxShadow:'0 8px 24px rgba(0,0,0,.08)'}}>
          <div style={{padding:'8px 10px',borderBottom:`1px solid ${T.line}`,marginBottom:6}}>
            <div style={{fontSize:13,fontWeight:600,color:T.ink}}>{user.name}</div>
            <div style={{fontSize:11,color:T.ink3}}>{user.team} · {user.role}</div>
          </div>
          <button onClick={onLogout} style={{display:'flex',alignItems:'center',gap:10,width:'100%',padding:'7px 10px',background:'transparent',border:'none',borderRadius:6,fontSize:12.5,color:T.ink2,cursor:'pointer'}}><Icon name="users" size={14} color={T.ink3}/>Changer de profil</button>
        </div>
      </>}
    </div>
  </header>;
}

export default function App() {
  const [user,setUser]=useState(null);
  const [screen,setScreen]=useState('login');
  const [project,setProject]=useState(MY_PROJECTS[0]);
  if(!user||screen==='login') return <LoginScreen onLogin={u=>{setUser(u);setScreen('dashboard');}}/>;
  return <div style={{display:'flex',flexDirection:'column',height:'100vh',overflow:'hidden',fontFamily:'-apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif',fontSize:13,color:T.ink,background:T.bg,WebkitFontSmoothing:'antialiased'}}>
    <TopBar user={user} screen={screen} project={project} onHome={()=>setScreen('dashboard')} onLogout={()=>{setUser(null);setScreen('login');}}/>
    {screen==='dashboard'&&<Dashboard user={user} onOpenProject={p=>{setProject(p);setScreen('configurator');}} onNewProject={()=>{setProject(null);setScreen('configurator');}} onOpenTemplate={tpl=>{setProject({name:'Nouveau — '+tpl.name,pageFormat:tpl.pageFormat,palette:tpl.palette,client:tpl.kind==='client'?tpl.name:'',basedOn:tpl.name});setScreen('configurator');}}/>}
    {screen==='configurator'&&<Configurator user={user} project={project}/>}
  </div>;
}
