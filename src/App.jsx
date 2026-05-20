import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { createRoot } from 'react-dom/client';
import { USE_CLOUD } from './lib/supabase.js';
import { signIn, signInByName, signUpWithName, signOut, getSession, getProfile, toAppUser, listUsers, deleteUser } from './lib/auth.js';
import { loadProjects, upsertProject, deleteProject, projectToDisplay,
         loadTemplates, upsertTemplate, deleteTemplate, templateToDisplay,
         findTemplateByName, getAdminStorageStats,
         adminExportUserProjects, adminImportProjects, adminDeleteUserProjects } from './lib/db.js';

const PDF_QUALITY = [
  {id:'web',      label:'Web',      sub:'72 dpi · partage en ligne',     scale:1.5, q:0.72},
  {id:'standard', label:'Standard', sub:'150 dpi · impression courante',  scale:2,   q:0.82},
  {id:'hd',       label:'HD',       sub:'300 dpi · haute qualité',        scale:3,   q:0.92},
];

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

// ── Modifica qui la password admin ────────────────────────────
const ADMIN_PASS = 'ABRANE2026';

const BrandCtx = React.createContext({officialLogo:'',wmLogo:'',shopLogos:{},stampLogo:'',setBrand:()=>{}});

const USERS = [
  {id:'u-admin',name:'Administrateur ABRANE',initials:'AD',role:'superadmin',hasSig:false,team:'ABRANE',requiresPassword:true},
];
const TEAM_TEMPLATES = [
  {id:'t-std',name:'ABRANE — Standard',kind:'generic',desc:'Modèle de base ABRANE. Couleurs crème + or.',palette:['#E8DCC8','#C8A96E','#2B2B2B'],pageFormat:'h-full',badges:['Officiel'],author:'Sandro Caron',updated:'Il y a 3 j',uses:28,lastAdminNote:null},
];
const MY_PROJECTS = [];
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
  // Supabase template opened to create a new project
  if(project?._isTemplate && project.data){
    return {
      ...project.data,
      name: project.name || project.data.client || 'Nouveau projet',
      basedOn: project.basedOn || '',
      files: [], contentOrder: [], annotations: {}, annotSnaps: {},
      pageNotes: {}, contentZoom: {}, contentPos: {},
      sigUrl: '', _dirty: false,
    };
  }
  // Supabase saved project: has .data with the full saved state
  if(project?.data && typeof project.data==='object' && 'client' in project.data){
    return {
      files:[], contentOrder:[], annotations:{}, annotSnaps:{}, pageNotes:{}, contentZoom:{}, contentPos:{},
      ...project.data,
      _dirty:false
    };
  }
  const t=new Date(), dd=String(t.getDate()).padStart(2,'0'), mm=String(t.getMonth()+1).padStart(2,'0');
  return {
    name:project?.name||'Nouveau projet', client:project?.client||'SANDRO',
    subtitle:project?.subtitle||'Détails', year:'2026', rev:'REV 01',
    projectDate:`${dd}/${mm}/${t.getFullYear()}`, mainTitle:project?.mainTitle||'BOOK',
    pageFormat:project?.pageFormat||'h-full',
    palette:{c1:project?.palette?.[0]||'#E8DCC8',c2:project?.palette?.[1]||'#C8A96E',c3:project?.palette?.[2]||'#2B2B2B'},
    logoScale:100, logoX:80, logoY:5, clientLogoUrl:'',
    showQuoteRef:false,quoteRef:'',showInternalRef:false,internalRef:'',
    showContact:false,contact:'',showSendDate:false,sendDate:'',showProjectType:false,projectType:'',
    tags:[],
    enIdx:true,enMat:true,enNotes:false,idxMode:'all',thumbCount:12,
    materials:SAMPLE_MATS, files:[], contentOrder:[],
    backLines:['ABRANE France S.A.S','7 rue du Pont à Lunettes','69390 Vourles','Tél: +33(0)4.78.95.96.20'],
    backDecor:'BOOK', sigEnabled:false, sigPlacement:'all', wmEnabled:false, wmOpacity:10, sigUrl:'',
    sigScale:30, sigX:78, sigY:88,
    stampEnabled:false, stampOpacity:70, stampScale:25, stampX:50, stampY:50, stampPlacement:'all',
    symEnabled:false, symPlacement:'all', symText:'', symScale:20, symX:50, symY:50, symPageNum:1,
    advEnabled:false, advStatus:'AF', advPlacement:'all', advScale:15, advX:85, advY:8, advPageNum:1,
    disclaimerEnabled:false, disclaimerLang:'fr', disclaimerPlacement:'all', disclaimerSize:6, disclaimerX:50, disclaimerY:95, disclaimerPageNum:1,
    stripeLogoScale:80, stripeLogoY:0,
    bgImageUrl:'', bgX:50, bgY:50, bgScale:100,
    notes:[''],enNotes:false, noteContent:'', noteHtml:'', annotations:{}, annotSnaps:{}, pageNotes:{}, contentZoom:{}, contentPos:{}, _dirty:false,
  };
};

const computeCompletion = (s, dirty={}) => ({
  project:dirty.project&&s.client?.length>0?'done':'',palette:dirty.palette?'done':'',
  format:dirty.format?'done':'',cover:dirty.cover&&s.mainTitle?.length>0?'done':'',
  index:dirty.index&&s.enIdx?'done':'',mat:dirty.mat&&s.enMat?'done':'',
  notes:dirty.notes&&s.enNotes?'done':'',content:dirty.content&&s.files.length>0?'done':'',
  back:dirty.back&&s.backLines.some(l=>l)?'done':'',sign:dirty.sign&&s.sigEnabled?'done':'',sym:dirty.sym&&s.symEnabled?'done':'',
});

const inputSt = {width:'100%',padding:'7px 10px',background:T.surface,border:`1px solid ${T.line}`,borderRadius:6,fontSize:12.5,color:T.ink,fontFamily:'inherit',outline:'none',boxSizing:'border-box'};
const pillSt = (v='default') => ({display:'inline-flex',alignItems:'center',gap:5,padding:'2px 8px',borderRadius:999,fontSize:10.5,fontWeight:500,background:v==='gold'?T.goldTint:v==='navy'?T.navyTint:T.panel2,color:v==='gold'?T.navy:v==='navy'?T.navy:T.ink2,border:`1px solid ${v==='gold'?T.goldSoft:v==='navy'?'#D2DBEC':T.lineSoft}`});
const btnSt = (v='default',sm=false) => ({display:'inline-flex',alignItems:'center',gap:6,border:`1px solid ${v==='primary'?T.navy:v==='gold'?T.goldSoft:T.line}`,background:v==='primary'?T.navy:v==='gold'?T.goldTint:v==='ghost'?'transparent':T.surface,color:v==='primary'?'#fff':v==='gold'?T.navy:T.ink,fontSize:sm?11.5:12.5,fontWeight:500,padding:sm?'5px 9px':'7px 12px',borderRadius:6,cursor:'pointer',fontFamily:'inherit'});

function MiniCover({palette,client,subtitle,clientLogoUrl}) {
  const {officialLogo,shopLogos}=React.useContext(BrandCtx);
  const [c1,c2,c3]=palette;
  const isAbrane=client==='ABRANE';
  // Priority: explicit url from project data → shopLogos context → official logo (for ABRANE)
  const logo=clientLogoUrl||(isAbrane?officialLogo:(shopLogos?.[client]||''));
  return <div style={{position:'absolute',inset:0,background:c1,display:'grid',gridTemplateColumns:'1fr 7%'}}>
    <div style={{display:'flex',alignItems:'center',justifyContent:'flex-start',padding:'9% 12%',overflow:'hidden'}}>
      {logo
        ?<img src={logo} alt={client} style={{maxWidth:'100%',maxHeight:'100%',objectFit:'contain',display:'block'}}/>
        :<div style={{display:'flex',flexDirection:'column',alignItems:'flex-start',gap:5}}>
          <div style={{width:46,height:46,borderRadius:10,background:paletteHash(client||'A'),color:'#fff',display:'grid',placeItems:'center',fontSize:17,fontWeight:900,flexShrink:0}}>{initialsFrom(client||'A')}</div>
          <div style={{fontWeight:900,color:c3,fontSize:13,letterSpacing:'.03em',lineHeight:1,marginTop:2}}>{(client||'').toUpperCase()}</div>
          {subtitle&&<div style={{fontSize:7.5,color:c3,opacity:.5,letterSpacing:'.1em',textTransform:'uppercase'}}>{subtitle}</div>}
        </div>
      }
    </div>
    <div style={{background:c2,borderLeft:`2px solid ${shade(c2,-10)}`}}/>
  </div>;
}

function StripeAbraneLogo() {
  const {officialLogo}=React.useContext(BrandCtx);
  if(officialLogo) return <img src={officialLogo} alt="ABRANE" style={{width:'80%',objectFit:'contain',display:'block',flexShrink:0}}/>;
  return <div style={{background:T.navy,borderRadius:3,padding:'5px 0',display:'flex',flexDirection:'column',alignItems:'center',width:'62%',flexShrink:0}}>
    {'ABRANE'.split('').map((c,i)=><span key={i} style={{color:'#fff',fontWeight:900,fontSize:8,lineHeight:1.25}}>{c}</span>)}
  </div>;
}

function AdminPanel({onClose, currentUserId}) {
  const {officialLogo,wmLogo,shopLogos,stampLogo,setBrand}=React.useContext(BrandCtx);
  const [newShopName,setNewShopName]=useState('');
  const [userList,setUserList]=useState([]);
  const [usersLoaded,setUsersLoaded]=useState(false);
  const [deletingId,setDeletingId]=useState(null);
  const [confirmDelete,setConfirmDelete]=useState(null);
  const [storageStats,setStorageStats]=useState(null);
  const [storageLoading,setStorageLoading]=useState(false);
  const [userOps,setUserOps]=useState({}); // {userId: {exporting,importing,deleting}}

  React.useEffect(()=>{
    listUsers().then(list=>{setUserList(list);setUsersLoaded(true);}).catch(()=>setUsersLoaded(true));
  },[]);

  const loadStorage=async()=>{
    setStorageLoading(true);
    const stats=await getAdminStorageStats();
    setStorageStats(stats);
    setStorageLoading(false);
  };

  const fmtBytes=b=>b<1024?`${b} o`:b<1048576?`${(b/1024).toFixed(1)} Ko`:b<1073741824?`${(b/1048576).toFixed(1)} Mo`:`${(b/1073741824).toFixed(2)} Go`;

  const setOp=(uid,key,val)=>setUserOps(prev=>({...prev,[uid]:{...(prev[uid]||{}), [key]:val}}));

  const exportUser=async(u)=>{
    setOp(u.id,'exporting',true);
    try{
      const projects=await adminExportUserProjects(u.id);
      if(!projects.length){alert('Aucun projet trouvé pour cet utilisateur.\n(Vérifiez la politique RLS Supabase.)');return;}
      const blob=new Blob([JSON.stringify({exportedAt:new Date().toISOString(),user:{id:u.id,name:u.name},projects},null,2)],{type:'application/json'});
      const a=document.createElement('a');
      a.href=URL.createObjectURL(blob);
      a.download=`abrane_projets_${(u.name||u.id).replace(/\s+/g,'_')}_${new Date().toISOString().slice(0,10)}.json`;
      a.click();URL.revokeObjectURL(a.href);
    }catch(e){alert('Erreur export : '+e.message);}
    finally{setOp(u.id,'exporting',false);}
  };

  const importUser=(u)=>{
    const input=document.createElement('input');
    input.type='file';input.accept='.json,application/json';
    input.onchange=async e=>{
      const file=e.target.files?.[0];if(!file)return;
      setOp(u.id,'importing',true);
      try{
        const text=await file.text();
        const json=JSON.parse(text);
        const projects=Array.isArray(json)?json:(json.projects||[]);
        if(!projects.length){alert('Aucun projet trouvé dans le fichier.');return;}
        await adminImportProjects(u.id,projects);
        alert(`${projects.length} projet(s) importé(s) pour ${u.name}.`);
        loadStorage();
      }catch(e){alert('Erreur import : '+e.message);}
      finally{setOp(u.id,'importing',false);}
    };
    input.click();
  };

  const deleteUserProjects=async(u)=>{
    if(!window.confirm(`Supprimer TOUS les projets de ${u.name} de Supabase ?\n\nAssurez-vous d'avoir exporté une sauvegarde avant de continuer.`))return;
    setOp(u.id,'deleting',true);
    try{
      await adminDeleteUserProjects(u.id);
      alert(`Projets de ${u.name} supprimés.`);
      loadStorage();
    }catch(e){alert('Erreur suppression : '+e.message);}
    finally{setOp(u.id,'deleting',false);}
  };

  const doDelete=async()=>{
    if(!confirmDelete) return;
    setDeletingId(confirmDelete.id);
    try{
      await deleteUser(confirmDelete.id);
      setUserList(l=>l.filter(u=>u.id!==confirmDelete.id));
    }catch(e){ alert(e.message); }
    finally{ setDeletingId(null); setConfirmDelete(null); }
  };
  const upload=(key,cb)=>e=>{
    const f=e.target.files?.[0];if(!f)return;
    const r=new FileReader();
    r.onload=ev=>{localStorage.setItem(key,ev.target.result);cb(ev.target.result);};
    r.readAsDataURL(f);
  };
  const remove=key=>{
    localStorage.removeItem(key);
    const field=key==='abrane_logo'?'officialLogo':key==='abrane_wm'?'wmLogo':'stampLogo';
    setBrand(b=>({...b,[field]:''}));
  };
  const uploadShop=e=>{
    const f=e.target.files?.[0];if(!f||!newShopName.trim())return;
    const name=newShopName.trim();
    const r=new FileReader();
    r.onload=ev=>{
      const updated={...(shopLogos||{}), [name]:ev.target.result};
      localStorage.setItem('abrane_shop_logos',JSON.stringify(updated));
      setBrand(b=>({...b,shopLogos:updated}));
      setNewShopName('');
    };
    r.readAsDataURL(f);
    e.target.value='';
  };
  const removeShop=name=>{
    const updated={...(shopLogos||{})};
    delete updated[name];
    localStorage.setItem('abrane_shop_logos',JSON.stringify(updated));
    setBrand(b=>({...b,shopLogos:updated}));
  };

  return <div style={{position:'fixed',inset:0,background:'rgba(15,20,40,.55)',zIndex:200,display:'grid',placeItems:'center',padding:'16px 0'}}>
    <div style={{width:480,maxWidth:'94vw',maxHeight:'90vh',background:T.surface,borderRadius:16,boxShadow:'0 24px 80px rgba(0,0,0,.25)',border:`1px solid ${T.line}`,display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'20px 28px 16px',flexShrink:0,borderBottom:`1px solid ${T.lineSoft}`}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:26,height:26,borderRadius:'50%',background:T.gold,color:'#fff',display:'grid',placeItems:'center',fontSize:12,fontWeight:800}}>A</div>
          <span style={{fontSize:15,fontWeight:700,color:T.ink}}>Administration ABRANE</span>
        </div>
        <button onClick={onClose} style={{background:'transparent',border:'none',cursor:'pointer',fontSize:18,color:T.ink3}}>✕</button>
      </div>

      <div style={{flex:1,overflowY:'auto',padding:'20px 28px 24px',display:'flex',flexDirection:'column',gap:16}}>
        {/* Logo officiel */}
        <div style={{border:`1px solid ${T.line}`,borderRadius:10,padding:16}}>
          <div style={{fontSize:12,fontWeight:700,color:T.ink,marginBottom:8}}>Logo ABRANE officiel</div>
          <div style={{fontSize:11,color:T.ink3,marginBottom:10}}>Affiché sur la page d'accueil, la barre de navigation et toutes les strisce pages.</div>
          {officialLogo
            ?<div style={{display:'flex',alignItems:'center',gap:10}}>
                <img src={officialLogo} alt="Logo" style={{height:40,maxWidth:180,objectFit:'contain',border:`1px solid ${T.lineSoft}`,borderRadius:6,padding:4}}/>
                <button onClick={()=>remove('abrane_logo')} style={{...btnSt(undefined,true),color:'#C53030',borderColor:'#FECACA'}}>Supprimer</button>
              </div>
            :<label style={{...btnSt('primary',false),cursor:'pointer',display:'inline-flex'}}>
                <Icon name="upload" size={14} color="#fff"/>Importer le logo officiel (PNG / SVG)
                <input type="file" accept="image/*,.svg" style={{display:'none'}} onChange={upload('abrane_logo',v=>setBrand(b=>({...b,officialLogo:v})))}/>
              </label>
          }
        </div>

        {/* Logo filigrane */}
        <div style={{border:`1px solid ${T.line}`,borderRadius:10,padding:16}}>
          <div style={{fontSize:12,fontWeight:700,color:T.ink,marginBottom:8}}>Logo filigrane</div>
          <div style={{fontSize:11,color:T.ink3,marginBottom:10}}>Répété en diagonale sur toutes les pages quand la filigrane est activée. Préférez un PNG transparent ou un SVG.</div>
          {wmLogo
            ?<div style={{display:'flex',alignItems:'center',gap:10}}>
                <img src={wmLogo} alt="Logo WM" style={{height:40,maxWidth:180,objectFit:'contain',border:`1px solid ${T.lineSoft}`,borderRadius:6,padding:4}}/>
                <button onClick={()=>remove('abrane_wm')} style={{...btnSt(undefined,true),color:'#C53030',borderColor:'#FECACA'}}>Supprimer</button>
              </div>
            :<label style={{...btnSt(undefined,false),cursor:'pointer',display:'inline-flex'}}>
                <Icon name="upload" size={14} color={T.ink}/>Importer logo filigrane (PNG transparent / SVG)
                <input type="file" accept="image/*,.svg" style={{display:'none'}} onChange={upload('abrane_wm',v=>setBrand(b=>({...b,wmLogo:v})))}/>
              </label>
          }
        </div>

        {/* Tampon d'entreprise */}
        <div style={{border:`1px solid ${T.line}`,borderRadius:10,padding:16}}>
          <div style={{fontSize:12,fontWeight:700,color:T.ink,marginBottom:8}}>Tampon d'entreprise</div>
          <div style={{fontSize:11,color:T.ink3,marginBottom:10}}>Tampon d'entreprise sovrapposto sulle pagine. Preferire PNG trasparente o SVG.</div>
          {stampLogo
            ?<div style={{display:'flex',alignItems:'center',gap:10}}>
                <img src={stampLogo} alt="Tampon d'entreprise" style={{height:40,maxWidth:180,objectFit:'contain',border:`1px solid ${T.lineSoft}`,borderRadius:6,padding:4}}/>
                <button onClick={()=>remove('abrane_stamp')} style={{...btnSt(undefined,true),color:'#C53030',borderColor:'#FECACA'}}>Supprimer</button>
              </div>
            :<label style={{...btnSt(undefined,false),cursor:'pointer',display:'inline-flex'}}>
                <Icon name="upload" size={14} color={T.ink}/>Importer le tampon d'entreprise (PNG transparent / SVG)
                <input type="file" accept="image/*,.svg" style={{display:'none'}} onChange={upload('abrane_stamp',v=>setBrand(b=>({...b,stampLogo:v})))}/>
              </label>
          }
        </div>

        {/* Logos boutiques */}
        <div style={{border:`1px solid ${T.line}`,borderRadius:10,padding:16}}>
          <div style={{fontSize:12,fontWeight:700,color:T.ink,marginBottom:4}}>Logos boutiques clients</div>
          <div style={{fontSize:11,color:T.ink3,marginBottom:10}}>Le logo s'affiche automatiquement dans les miniatures dès que le nom du client correspond exactement.</div>
          {Object.keys(shopLogos||{}).length>0&&(
            <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:10}}>
              {Object.entries(shopLogos||{}).map(([name,url])=>(
                <div key={name} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 8px',background:T.panel,borderRadius:6,border:`1px solid ${T.lineSoft}`}}>
                  <img src={url} alt={name} style={{height:28,maxWidth:80,objectFit:'contain',display:'block',flexShrink:0}}/>
                  <span style={{flex:1,fontSize:12,fontWeight:600,color:T.ink,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{name}</span>
                  <button onClick={()=>removeShop(name)} style={{...btnSt(undefined,true),color:'#C53030',borderColor:'#FECACA',fontSize:10,flexShrink:0}}>Supprimer</button>
                </div>
              ))}
            </div>
          )}
          <div style={{display:'flex',gap:6,alignItems:'center'}}>
            <input value={newShopName} onChange={e=>setNewShopName(e.target.value)} placeholder="Nom de la boutique…" style={{...inputSt,flex:1}}/>
            <label style={{...btnSt(undefined,false),cursor:newShopName.trim()?'pointer':'not-allowed',display:'inline-flex',whiteSpace:'nowrap',opacity:newShopName.trim()?1:.5,flexShrink:0}}>
              <Icon name="upload" size={13} color={T.ink}/>Importer logo
              <input type="file" accept="image/*,.svg" disabled={!newShopName.trim()} style={{display:'none'}} onChange={uploadShop}/>
            </label>
          </div>
          {!newShopName.trim()&&<div style={{fontSize:10,color:T.ink4,marginTop:4}}>Saisissez le nom de la boutique avant d'importer.</div>}
        </div>

        {/* Gestion des utilisateurs */}
        <div style={{border:`1px solid ${T.line}`,borderRadius:10,padding:16}}>
          <div style={{fontSize:12,fontWeight:700,color:T.ink,marginBottom:10}}>Utilisateurs</div>
          {!usersLoaded
            ?<div style={{fontSize:11,color:T.ink4}}>Chargement…</div>
            :userList.length===0
              ?<div style={{fontSize:11,color:T.ink4}}>Aucun utilisateur trouvé.</div>
              :<div style={{display:'flex',flexDirection:'column',gap:8}}>
                {userList.map(u=>{
                  const ops=userOps[u.id]||{};
                  return <div key={u.id} style={{background:T.panel,borderRadius:8,border:`1px solid ${T.lineSoft}`,overflow:'hidden'}}>
                    {/* Ligne identité + supprimer compte */}
                    <div style={{display:'flex',alignItems:'center',gap:8,padding:'7px 10px'}}>
                      <div style={{width:26,height:26,borderRadius:'50%',background:T.navy,color:'#fff',display:'grid',placeItems:'center',fontWeight:700,fontSize:10,flexShrink:0}}>
                        {(u.name||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()}
                      </div>
                      <span style={{flex:1,fontSize:12,fontWeight:600,color:T.ink,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.name}</span>
                      {u.id!==currentUserId&&(
                        <button onClick={()=>setConfirmDelete(u)} disabled={!!deletingId}
                          style={{...btnSt(undefined,true),color:'#C53030',borderColor:'#FECACA',padding:'3px 8px',flexShrink:0}}>
                          <Icon name="trash" size={11} color="#C53030"/>
                        </button>
                      )}
                    </div>
                    {/* Ligne actions projets */}
                    <div style={{display:'flex',gap:6,padding:'6px 10px',borderTop:`1px solid ${T.lineSoft}`,background:'rgba(0,0,0,.02)',flexWrap:'wrap'}}>
                      <button onClick={()=>exportUser(u)} disabled={ops.exporting||ops.importing||ops.deleting}
                        style={{...btnSt(undefined,true),fontSize:10,gap:4,flexShrink:0}}>
                        {ops.exporting?'Export…':'⬇ Exporter projets'}
                      </button>
                      <button onClick={()=>importUser(u)} disabled={ops.exporting||ops.importing||ops.deleting}
                        style={{...btnSt(undefined,true),fontSize:10,gap:4,flexShrink:0}}>
                        {ops.importing?'Import…':'⬆ Importer projets'}
                      </button>
                      <button onClick={()=>deleteUserProjects(u)} disabled={ops.exporting||ops.importing||ops.deleting}
                        style={{...btnSt(undefined,true),fontSize:10,gap:4,color:'#C53030',borderColor:'#FECACA',flexShrink:0}}>
                        {ops.deleting?'Suppression…':'🗑 Vider Supabase'}
                      </button>
                    </div>
                  </div>;
                })}
              </div>
          }
        </div>

        {confirmDelete&&(
          <div style={{position:'fixed',inset:0,background:'rgba(15,20,40,.55)',zIndex:300,display:'grid',placeItems:'center'}}>
            <div style={{width:340,background:T.surface,borderRadius:14,padding:24,boxShadow:'0 16px 60px rgba(0,0,0,.22)',border:`1px solid ${T.line}`}}>
              <div style={{fontSize:14,fontWeight:700,color:T.ink,marginBottom:8}}>Supprimer l'utilisateur ?</div>
              <div style={{fontSize:12.5,color:T.ink2,marginBottom:18}}>
                <strong>{confirmDelete.name}</strong> sera définitivement supprimé. Cette action est irréversible.
              </div>
              <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
                <button onClick={()=>setConfirmDelete(null)} style={btnSt(undefined,true)}>Annuler</button>
                <button onClick={doDelete} disabled={!!deletingId}
                  style={{...btnSt('primary'),background:'#C53030',borderColor:'#C53030',opacity:deletingId?.7:1}}>
                  {deletingId?'Suppression…':'Supprimer'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stockage Supabase */}
        <div style={{border:`1px solid ${T.line}`,borderRadius:10,padding:16}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
            <div style={{fontSize:12,fontWeight:700,color:T.ink}}>Stockage Supabase (plan Free · 500 Mo)</div>
            <button onClick={loadStorage} disabled={storageLoading} style={{...btnSt(undefined,true),fontSize:10,flexShrink:0}}>
              {storageLoading?'Chargement…':'🔄 Actualiser'}
            </button>
          </div>
          {!storageStats&&!storageLoading&&(
            <div style={{fontSize:11,color:T.ink3}}>Cliquez sur Actualiser pour analyser l'espace utilisé.</div>
          )}
          {storageLoading&&(
            <div style={{fontSize:11,color:T.ink3}}>Analyse en cours…</div>
          )}
          {storageStats&&!storageLoading&&(()=>{
            if(storageStats.error) return <div style={{fontSize:11,color:'#C53030'}}>Erreur : {storageStats.error}<br/><span style={{color:T.ink3}}>Il faut peut-être une politique RLS permettant à l'admin de lire tous les projets.</span></div>;
            const FREE_LIMIT=500*1024*1024;
            const pct=Math.min(100,(storageStats.totalBytes/FREE_LIMIT)*100);
            const barColor=pct>85?'#C53030':pct>65?'#F97316':'#16A34A';
            return <>
              {/* Barre globale */}
              <div style={{marginBottom:12}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:T.ink2,marginBottom:4}}>
                  <span><strong>{fmtBytes(storageStats.totalBytes)}</strong> utilisés</span>
                  <span style={{color:barColor,fontWeight:700}}>{pct.toFixed(1)}%</span>
                </div>
                <div style={{height:8,borderRadius:4,background:T.line,overflow:'hidden'}}>
                  <div style={{width:`${pct}%`,height:'100%',background:barColor,borderRadius:4,transition:'width .4s'}}/>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:T.ink4,marginTop:3}}>
                  <span>0</span><span>500 Mo (limite free)</span>
                </div>
              </div>
              {/* Détail modèles */}
              <div style={{fontSize:11,color:T.ink3,marginBottom:8}}>
                Modèles : <strong style={{color:T.ink2}}>{fmtBytes(storageStats.templateBytes)}</strong>
                &nbsp;·&nbsp; Projets total : <strong style={{color:T.ink2}}>{storageStats.projectCount}</strong>
              </div>
              {/* Par utilisateur */}
              {Object.keys(storageStats.userStats).length>0&&(
                <div style={{display:'flex',flexDirection:'column',gap:6}}>
                  {Object.entries(storageStats.userStats)
                    .sort((a,b)=>b[1].bytes-a[1].bytes)
                    .map(([uid,s])=>{
                      const u=userList.find(x=>x.id===uid);
                      const name=u?.name||uid.slice(0,8)+'…';
                      const initials=(u?.name||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
                      const userPct=Math.min(100,(s.bytes/FREE_LIMIT)*100);
                      return <div key={uid} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 8px',background:T.panel,borderRadius:6,border:`1px solid ${T.lineSoft}`}}>
                        <div style={{width:26,height:26,borderRadius:'50%',background:T.navy,color:'#fff',display:'grid',placeItems:'center',fontSize:10,fontWeight:700,flexShrink:0}}>{initials}</div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:'flex',justifyContent:'space-between',marginBottom:2}}>
                            <span style={{fontSize:11,fontWeight:600,color:T.ink,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{name}</span>
                            <span style={{fontSize:10,color:T.ink3,flexShrink:0,marginLeft:8}}>{s.count} projet{s.count>1?'s':''} · {fmtBytes(s.bytes)}</span>
                          </div>
                          <div style={{height:4,borderRadius:2,background:T.line,overflow:'hidden'}}>
                            <div style={{width:`${userPct}%`,height:'100%',background:userPct>85?'#C53030':userPct>65?'#F97316':T.navy,borderRadius:2}}/>
                          </div>
                        </div>
                      </div>;
                    })
                  }
                </div>
              )}
              <div style={{marginTop:8,fontSize:10,color:T.ink4,fontStyle:'italic'}}>* Tailles estimées (données JSON brutes). La taille réelle en base inclut les index et métadonnées système.</div>
            </>;
          })()}
        </div>

        <div style={{padding:'10px 12px',background:'#FFF8E6',border:`1px solid #F6D860`,borderRadius:8,fontSize:11,color:'#7A5C00',lineHeight:1.5}}>
          <strong>⚠ Logo en stockage local</strong> — visible uniquement sur cet appareil. Pour l'intégrer définitivement dans le code (visible par tous) : copiez la chaîne base64 ci-dessous et envoyez-la au développeur (ou dans le chat IA) pour l'incorporer comme constante dans <code style={{background:'rgba(0,0,0,.06)',padding:'0 3px',borderRadius:2}}>App.jsx</code>.
          {officialLogo&&<div style={{marginTop:8,display:'flex',gap:6}}>
            <button onClick={()=>navigator.clipboard.writeText(officialLogo).then(()=>alert('Base64 copié !'))} style={{...btnSt(undefined,true),fontSize:10}}>📋 Copier base64 logo</button>
          </div>}
          {wmLogo&&<div style={{marginTop:6,display:'flex',gap:6}}>
            <button onClick={()=>navigator.clipboard.writeText(wmLogo).then(()=>alert('Base64 copié !'))} style={{...btnSt(undefined,true),fontSize:10}}>📋 Copier base64 filigrane</button>
          </div>}
          {stampLogo&&<div style={{marginTop:6,display:'flex',gap:6}}>
            <button onClick={()=>navigator.clipboard.writeText(stampLogo).then(()=>alert('Base64 copié !'))} style={{...btnSt(undefined,true),fontSize:10}}>📋 Copier base64 tampon d'entreprise</button>
          </div>}
        </div>
      </div>
    </div>
  </div>;
}

function AbraneLogoBox({size='md'}) {
  const {officialLogo}=React.useContext(BrandCtx);
  const h=size==='lg'?56:size==='md'?40:28;
  if(officialLogo) return <img src={officialLogo} alt="ABRANE" style={{height:h,maxWidth:200,objectFit:'contain',display:'block'}}/>;
  const fs=size==='lg'?18:size==='md'?13:10;
  return <div style={{background:T.navy,borderRadius:size==='lg'?6:4,padding:size==='lg'?'10px 24px':size==='md'?'5px 12px':'3px 8px',display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
    <span style={{color:'#fff',fontWeight:900,fontSize:fs,letterSpacing:2}}>ABRANE</span>
    {size==='lg'&&<span style={{color:'rgba(255,255,255,.5)',fontSize:8,letterSpacing:2}}>LE FABRICANT DE MOBILIER</span>}
  </div>;
}

function LoginScreen({onLogin}) {
  const logoBox=<div style={{display:'flex',justifyContent:'center',marginBottom:20}}><AbraneLogoBox size="lg"/></div>;

  // ── Cloud login (USE_CLOUD = true) ────────────────────────────
  const [authMode,setAuthMode]=useState('login'); // 'login' | 'register'
  const [selectedUser,setSelectedUser]=useState(null); // user picked from list
  const [manualName,setManualName]=useState('');       // typed name (login)
  const [fullName,setFullName]=useState('');           // new user name (register)
  const [pwd,setPwd]=useState('');
  const [confirmPwd,setConfirmPwd]=useState('');
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState('');
  const [userList,setUserList]=useState([]);           // [{id, name}]
  const [listLoaded,setListLoaded]=useState(false);

  useEffect(()=>{
    if(!USE_CLOUD) return;
    listUsers().then(list=>{setUserList(list);setListLoaded(true);}).catch(()=>setListLoaded(true));
  },[]);

  const resetForm=()=>{setPwd('');setConfirmPwd('');setErr('');setSelectedUser(null);setManualName('');setFullName('');};

  const doLogin=async()=>{
    const name=(selectedUser?.name||manualName).trim();
    if(!name||!pwd){setErr('Renseignez votre nom et votre mot de passe.');return;}
    setLoading(true);setErr('');
    try{
      // Admin can use email directly; others use name lookup
      const sbUser=name.includes('@')?await signIn(name,pwd):await signInByName(name,pwd);
      const profile=await getProfile(sbUser.id);
      onLogin(toAppUser(sbUser,profile));
    }catch(e){
      setErr(e.message==='Invalid login credentials'?'Nom ou mot de passe incorrect.':e.message);
    }finally{setLoading(false);}
  };

  const doRegister=async()=>{
    if(!fullName.trim()){setErr('Saisissez votre prénom et nom.');return;}
    if(!pwd){setErr('Choisissez un mot de passe.');return;}
    if(pwd!==confirmPwd){setErr('Les mots de passe ne correspondent pas.');return;}
    if(pwd.length<6){setErr('Mot de passe : 6 caractères minimum.');return;}
    setLoading(true);setErr('');
    try{
      const sbUser=await signUpWithName(fullName.trim(),pwd);
      const profile=await getProfile(sbUser.id);
      onLogin(toAppUser(sbUser,profile));
    }catch(e){
      const msg=e.message||'';
      if(/rate limit|over_email/i.test(msg))
        setErr('Limite Supabase atteinte. Dans le dashboard Supabase → Authentication → Settings → désactivez "Enable email confirmations".');
      else setErr(msg);
    }
    finally{setLoading(false);}
  };

  if(USE_CLOUD) return (
    <div style={{position:'fixed',inset:0,display:'grid',placeItems:'center',background:T.bg,zIndex:100}}>
      <div style={{width:420,maxWidth:'93vw',background:T.surface,borderRadius:22,padding:'36px 36px 28px',boxShadow:'0 24px 80px rgba(15,20,40,.22)',border:`1px solid ${T.line}`}}>
        {logoBox}
        <div style={{display:'inline-flex',width:'100%',padding:3,background:T.panel2,borderRadius:8,border:`1px solid ${T.lineSoft}`,marginBottom:22,boxSizing:'border-box'}}>
          {[{v:'login',l:'Se connecter'},{v:'register',l:'Créer un compte'}].map(m=>(
            <button key={m.v} onClick={()=>{setAuthMode(m.v);resetForm();}} style={{flex:1,padding:'6px 0',borderRadius:6,border:'none',background:authMode===m.v?'#fff':'transparent',color:authMode===m.v?T.ink:T.ink3,fontSize:12.5,fontWeight:authMode===m.v?600:400,cursor:'pointer',boxShadow:authMode===m.v?'0 1px 3px rgba(0,0,0,.06)':'none'}}>{m.l}</button>
          ))}
        </div>

        {authMode==='login'&&<>
          {/* User list from Supabase */}
          {listLoaded&&userList.length>0&&<>
            <div style={{fontSize:12.5,fontFamily:'inherit',color:T.ink4,marginBottom:7,fontWeight:600,letterSpacing:'.05em',textTransform:'uppercase'}}>Sélectionnez votre profil</div>
            <div style={{display:'flex',flexDirection:'column',gap:5,marginBottom:14,maxHeight:180,overflowY:'auto'}}>
              {userList.map(u=><button key={u.id} onClick={()=>{setSelectedUser(u);setManualName('');setErr('');}} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 10px',borderRadius:8,border:`1.5px solid ${selectedUser?.id===u.id?T.navy:T.lineSoft}`,background:selectedUser?.id===u.id?T.navyTint:T.surface,cursor:'pointer',width:'100%',textAlign:'left',fontFamily:'inherit'}}>
                <div style={{width:28,height:28,borderRadius:'50%',background:selectedUser?.id===u.id?T.navy:T.panel2,color:selectedUser?.id===u.id?'#fff':T.ink3,display:'grid',placeItems:'center',fontWeight:700,fontSize:10,flexShrink:0,fontFamily:'inherit'}}>
                  {(u.name||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()}
                </div>
                <span style={{fontSize:12.5,fontFamily:'inherit',fontWeight:selectedUser?.id===u.id?600:400,color:T.ink}}>{u.name}</span>
              </button>)}
            </div>
            <div style={{fontSize:12.5,fontFamily:'inherit',color:T.ink4,marginBottom:6,textAlign:'center'}}>— ou saisir manuellement —</div>
          </>}
          <div style={{display:'flex',flexDirection:'column',gap:9}}>
            <input autoFocus={!selectedUser} style={inputSt}
              placeholder={selectedUser?`Connecté en tant que : ${selectedUser.name}`:'Votre nom ou e-mail admin'}
              value={selectedUser?selectedUser.name:manualName}
              onChange={e=>{setSelectedUser(null);setManualName(e.target.value);setErr('');}}
              onKeyDown={e=>e.key==='Enter'&&document.getElementById('login-pwd')?.focus()}/>
            <input id="login-pwd" type="password" style={inputSt} placeholder="Mot de passe"
              value={pwd} onChange={e=>{setPwd(e.target.value);setErr('');}}
              onKeyDown={e=>e.key==='Enter'&&doLogin()} autoFocus={!!selectedUser}/>
            {err&&<div style={{fontSize:12.5,fontFamily:'inherit',color:'#C53030',textAlign:'center'}}>{err}</div>}
            <button style={{...btnSt('primary'),justifyContent:'center',opacity:loading?.7:1}} onClick={doLogin} disabled={loading}>
              {loading?'Connexion…':'Se connecter'}
            </button>
          </div>
        </>}

        {authMode==='register'&&<div style={{display:'flex',flexDirection:'column',gap:9}}>
          <input autoFocus style={inputSt} placeholder="Prénom et Nom (ex: Marie Dupont)"
            value={fullName} onChange={e=>{setFullName(e.target.value);setErr('');}}
            onKeyDown={e=>e.key==='Enter'&&document.getElementById('reg-pwd')?.focus()}/>
          <input id="reg-pwd" type="password" style={inputSt} placeholder="Mot de passe (6 caractères min.)"
            value={pwd} onChange={e=>{setPwd(e.target.value);setErr('');}}
            onKeyDown={e=>e.key==='Enter'&&document.getElementById('reg-cpwd')?.focus()}/>
          <input id="reg-cpwd" type="password" style={inputSt} placeholder="Confirmer le mot de passe"
            value={confirmPwd} onChange={e=>{setConfirmPwd(e.target.value);setErr('');}}
            onKeyDown={e=>e.key==='Enter'&&doRegister()}/>
          {err&&<div style={{fontSize:12.5,fontFamily:'inherit',color:'#C53030',textAlign:'center'}}>{err}</div>}
          <button style={{...btnSt('primary'),justifyContent:'center',opacity:loading?.7:1}} onClick={doRegister} disabled={loading}>
            {loading?'Création du compte…':'Créer mon compte'}
          </button>
          <div style={{fontSize:11,fontFamily:'inherit',color:T.ink4,textAlign:'center',lineHeight:1.5}}>Pas besoin d'e-mail · Un identifiant interne sera généré automatiquement.</div>
        </div>}
      </div>
    </div>
  );

  // ── Local mode (USE_CLOUD = false, inchangé) ──────────────────
  const [newName,setNewName]=useState('');
  const doCreate=()=>{if(!newName.trim())return;onLogin({id:'new',name:newName.trim(),initials:newName.trim().split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase(),role:'editor',hasSig:false,team:'ABRANE FR'});};
  return <div style={{position:'fixed',inset:0,display:'grid',placeItems:'center',background:T.bg,zIndex:100}}>
    <div style={{width:420,maxWidth:'92vw',background:T.surface,borderRadius:22,padding:'36px 36px 24px',boxShadow:'0 24px 80px rgba(15,20,40,.22)',border:`1px solid ${T.line}`}}>
      {logoBox}
      <div style={{borderTop:`1px solid ${T.lineSoft}`,paddingTop:14,display:'flex',gap:8}}>
        <input style={inputSt} placeholder="Votre prénom et nom…" value={newName} onChange={e=>setNewName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&doCreate()}/>
        <button style={{...btnSt('primary',true),whiteSpace:'nowrap'}} onClick={doCreate}><Icon name="plus" size={12} color="#fff"/>Créer</button>
      </div>
    </div>
  </div>;
}

function Dashboard({user,onOpenProject,onNewProject,onOpenTemplate,onImportProject}) {
  const [tab,setTab]=useState('projects');
  const [q,setQ]=useState('');
  const [viewMode,setViewMode]=useState('grid');
  const [sort,setSort]=useState('recent');
  const [applyModal,setApplyModal]=useState(null);
  const [updateModal,setUpdateModal]=useState(null);
  const [deleteConfirm,setDeleteConfirm]=useState(null); // {type,id,name}
  const [dbProjects,setDbProjects]=useState([]);
  const [loadingProjects,setLoadingProjects]=useState(true);
  const [projectsError,setProjectsError]=useState(null);
  const [dbTemplates,setDbTemplates]=useState([]);
  const [loadingTemplates,setLoadingTemplates]=useState(true);
  const importRef=useRef(null);
  const isAdmin=user.role==='admin'||user.role==='superadmin';

  const refreshProjects=useCallback(()=>{
    if(!USE_CLOUD){setLoadingProjects(false);return;}
    setLoadingProjects(true);setProjectsError(null);
    loadProjects(user.id)
      .then(rows=>setDbProjects(rows.map(projectToDisplay)))
      .catch(e=>setProjectsError(e.message))
      .finally(()=>setLoadingProjects(false));
  },[user.id]);

  const refreshTemplates=useCallback(()=>{
    if(!USE_CLOUD){setLoadingTemplates(false);return;}
    setLoadingTemplates(true);
    loadTemplates()
      .then(rows=>setDbTemplates(rows.map(templateToDisplay)))
      .catch(()=>{})
      .finally(()=>setLoadingTemplates(false));
  },[]);

  useEffect(()=>{refreshProjects();},[refreshProjects]);
  useEffect(()=>{refreshTemplates();},[refreshTemplates]);

  const handleDeleteConfirmed=async()=>{
    if(!deleteConfirm)return;
    try{
      if(deleteConfirm.type==='project') await deleteProject(deleteConfirm.id,user.id);
      else await deleteTemplate(deleteConfirm.id);
    }catch(e){alert('Erreur : '+e.message);}
    setDeleteConfirm(null);
    if(deleteConfirm.type==='project') refreshProjects();
    else refreshTemplates();
  };

  const handleImportJson=e=>{
    const file=e.target.files?.[0];if(!file)return;
    const r=new FileReader();
    r.onload=ev=>{
      try{
        const parsed=JSON.parse(ev.target.result);
        const data=parsed.data||parsed;
        if(typeof data!=='object'||!data.client&&!data.name) throw new Error('Format invalide');
        onImportProject({name:parsed.name||data.name||'Projet importé',data});
      }catch{alert('Fichier .abrane.json invalide ou corrompu');}
    };
    r.readAsText(file);
    e.target.value='';
  };

  const allProjects=USE_CLOUD?dbProjects:MY_PROJECTS;
  const projects=allProjects.filter(p=>!q||p.name.toLowerCase().includes(q.toLowerCase())||p.client.toLowerCase().includes(q.toLowerCase()));
  const allTemplates=[...TEAM_TEMPLATES,...dbTemplates];
  const templatesFiltered=allTemplates.filter(t=>!q||t.name.toLowerCase().includes(q.toLowerCase()));
  return <div style={{flex:1,overflowY:'auto',background:T.bg}}>
    <div style={{maxWidth:1100,margin:'0 auto',padding:'32px 36px 80px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',gap:24,marginBottom:26}}>
        <div>
          <h1 style={{fontSize:26,fontWeight:600,color:T.ink,margin:0}}>Bonjour {user.name.split(' ')[0]}.</h1>
          <p style={{fontSize:13.5,color:T.ink3,marginTop:4,marginBottom:0}}>Reprenez un projet ou démarrez depuis un modèle client.</p>
        </div>
        <div style={{display:'flex',gap:8}}>
          <label style={{...btnSt(undefined),padding:'8px 14px',cursor:'pointer'}} title="Importer un fichier .abrane.json">
            <Icon name="upload" size={14} color={T.ink}/>Importer JSON
            <input ref={importRef} type="file" accept=".json" hidden onChange={handleImportJson}/>
          </label>
          <button style={{...btnSt('primary'),padding:'10px 16px',fontSize:13.5,borderRadius:8}} onClick={onNewProject}><Icon name="plus" size={14} color="#fff"/>Nouveau projet</button>
        </div>
      </div>
      <div style={{display:'inline-flex',gap:2,padding:3,background:T.panel2,borderRadius:8,border:`1px solid ${T.lineSoft}`,marginBottom:16}}>
        {[{id:'projects',icon:'folder',label:'Mes projets',cnt:allProjects.length},{id:'templates',icon:'folderTeam',label:'Modèles',cnt:allTemplates.length}].map(tb=>(
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
        <div style={{flex:1}}/>
        {tab==='projects'&&<div style={{display:'inline-flex',padding:2,background:T.panel2,borderRadius:6,border:`1px solid ${T.lineSoft}`}}>
          {[['grid','grid'],['list','index']].map(([k,ico])=><button key={k} onClick={()=>setViewMode(k)} style={{border:'none',background:viewMode===k?'#fff':'transparent',padding:'5px 8px',borderRadius:5,cursor:'pointer',display:'flex',alignItems:'center'}}><Icon name={ico} size={14} color={viewMode===k?T.navy:T.ink3}/></button>)}
        </div>}
      </div>
      {tab==='projects'&&loadingProjects&&<div style={{display:'flex',alignItems:'center',justifyContent:'center',padding:60,color:T.ink3,fontSize:13}}>Chargement…</div>}
      {tab==='projects'&&!loadingProjects&&projectsError&&<div style={{background:'#FEF2F2',border:'1px solid #FCA5A5',borderRadius:10,padding:'14px 18px',display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
        <Icon name="info" size={16} color="#DC2626"/>
        <div style={{flex:1}}><strong style={{color:'#991B1B'}}>Erreur de chargement</strong><div style={{fontSize:11.5,color:'#991B1B',marginTop:2}}>{projectsError}</div></div>
        <button onClick={refreshProjects} style={btnSt(undefined,true)}><Icon name="refresh" size={13} color={T.ink}/>Réessayer</button>
      </div>}
      {tab==='projects'&&!loadingProjects&&viewMode==='grid'&&<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:16}}>
        <button onClick={onNewProject} style={{minHeight:200,border:`1.5px dashed ${T.lineStrong}`,borderRadius:12,background:'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8,flexDirection:'column',color:T.ink2}}>
          <Icon name="plus" size={22} color={T.ink3}/><div><div style={{fontWeight:600,fontSize:13}}>Nouveau projet</div><div style={{fontSize:11,color:T.ink3,marginTop:2}}>Vierge ou depuis un modèle</div></div>
        </button>
        {projects.map(p=><div key={p.id} style={{background:T.surface,border:`1px solid ${T.line}`,borderRadius:12,overflow:'hidden',cursor:'pointer',position:'relative'}} onClick={()=>onOpenProject(p._raw||p)}>
          <button onClick={e=>{e.stopPropagation();setDeleteConfirm({type:'project',id:p.id,name:p.name});}} title="Supprimer" style={{position:'absolute',top:8,right:8,zIndex:3,width:22,height:22,borderRadius:'50%',background:'rgba(20,20,30,.55)',backdropFilter:'blur(4px)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',padding:0}}>
            <Icon name="close" size={11} color="#fff"/>
          </button>
          <div style={{aspectRatio:'297/210',background:T.panel,borderBottom:`1px solid ${T.lineSoft}`,position:'relative',overflow:'hidden'}}>
            <MiniCover palette={p.palette} client={p.client} subtitle={p.subtitle} clientLogoUrl={p.clientLogoUrl}/>
          </div>
          <div style={{padding:'12px 14px'}}>
            <div style={{fontSize:13,fontWeight:600,color:T.ink}}>{p.name}</div>
            <div style={{fontSize:11,color:T.ink3,marginTop:3,display:'flex',gap:6,flexWrap:'wrap'}}><span>{p.client}</span><span>·</span><span style={{fontWeight:500,color:T.ink2}}>{p.rev}</span></div>
            <div style={{fontSize:10.5,color:T.ink4,marginTop:2,display:'flex',gap:4,alignItems:'center'}}><Icon name="history" size={11} color={T.ink4}/>{p.updated} · {p.createdAt}</div>
            <div style={{display:'flex',gap:6,marginTop:8,flexWrap:'wrap'}}>
              <span style={pillSt()}><Icon name={p.pageFormat.startsWith('h')?'page':'pageVert'} size={11} color={T.ink2}/>{p.pageFormat.startsWith('h')?'Paysage':'Portrait'}</span>
              {p.basedOn&&<span style={pillSt('gold')}><Icon name="layers" size={11} color={T.navy}/>{p.basedOn}</span>}
            </div>
          </div>
        </div>)}
      </div>}
      {tab==='projects'&&!loadingProjects&&viewMode==='list'&&<div style={{background:T.surface,border:`1px solid ${T.line}`,borderRadius:12,overflow:'hidden'}}>
        <div style={{display:'grid',gridTemplateColumns:'40px 1fr 120px 80px 80px 100px',gap:12,padding:'8px 14px',background:T.panel,borderBottom:`1px solid ${T.line}`,fontSize:10.5,fontWeight:600,color:T.ink4,textTransform:'uppercase',letterSpacing:'.06em'}}>
          <div/><div>Nom</div><div>Client</div><div>Révision</div><div>Pages</div><div>Modifié</div>
        </div>
        {projects.map((p,i)=><div key={p.id} style={{display:'grid',gridTemplateColumns:'40px 1fr 120px 80px 80px 100px 32px',gap:12,padding:'10px 14px',borderBottom:i<projects.length-1?`1px solid ${T.lineSoft}`:'none',cursor:'pointer',alignItems:'center',background:T.surface}} onMouseEnter={e=>e.currentTarget.style.background=T.tint} onMouseLeave={e=>e.currentTarget.style.background=T.surface}>
          <div style={{width:32,height:32,borderRadius:6,overflow:'hidden',border:`1px solid ${T.line}`,position:'relative',flexShrink:0}} onClick={()=>onOpenProject(p._raw||p)}>
            <MiniCover palette={p.palette} client={p.client} subtitle="" clientLogoUrl={p.clientLogoUrl}/>
          </div>
          <div onClick={()=>onOpenProject(p._raw||p)}><div style={{fontSize:13,fontWeight:600,color:T.ink}}>{p.name}</div><div style={{fontSize:10.5,color:T.ink4}}>Créé {p.createdAt}</div></div>
          <div style={{fontSize:12,color:T.ink2}} onClick={()=>onOpenProject(p._raw||p)}>{p.client}</div>
          <span style={{...pillSt('navy'),fontSize:10}} onClick={()=>onOpenProject(p._raw||p)}>{p.rev}</span>
          <div style={{fontSize:12,color:T.ink2}} onClick={()=>onOpenProject(p._raw||p)}>{p.pages} p.</div>
          <div style={{fontSize:11.5,color:T.ink3}} onClick={()=>onOpenProject(p._raw||p)}>{p.updated}</div>
          <button onClick={e=>{e.stopPropagation();setDeleteConfirm({type:'project',id:p.id,name:p.name});}} style={{width:28,height:28,borderRadius:6,background:'transparent',border:`1px solid ${T.line}`,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',padding:0}} title="Supprimer">
            <Icon name="trash" size={13} color={T.ink3}/>
          </button>
        </div>)}
      </div>}
      {tab==='templates'&&<div style={{display:'flex',flexDirection:'column',gap:16}}>
        {loadingTemplates&&<div style={{display:'flex',alignItems:'center',justifyContent:'center',padding:40,color:T.ink3,fontSize:13}}>Chargement…</div>}
        {!loadingTemplates&&<>
          {TEAM_TEMPLATES.map(t=><button key={t.id} onClick={()=>setApplyModal(t)} style={{width:'100%',display:'grid',gridTemplateColumns:'180px 1fr auto',background:T.surface,border:`2px solid ${T.navy}`,borderRadius:12,overflow:'hidden',cursor:'pointer',textAlign:'left',padding:0,boxShadow:`0 0 0 4px ${T.navyTint}`}}>
            <div style={{aspectRatio:'297/210',background:T.panel,position:'relative',overflow:'hidden',borderRight:`1px solid ${T.line}`}}>
              <MiniCover palette={t.palette} client="ABRANE" subtitle="MODÈLE STANDARD"/>
              <div style={{position:'absolute',top:8,left:8,background:T.navy,color:'#fff',fontSize:9,fontWeight:700,letterSpacing:'.1em',padding:'2px 7px',borderRadius:4}}>OFFICIEL</div>
            </div>
            <div style={{padding:'18px 22px',display:'flex',flexDirection:'column',justifyContent:'center',gap:6}}>
              <div style={{fontSize:16,fontWeight:700,color:T.ink}}>{t.name}</div>
              <div style={{fontSize:12.5,color:T.ink3,lineHeight:1.5}}>{t.desc}</div>
            </div>
            <div style={{padding:'18px 20px',display:'flex',alignItems:'center',borderLeft:`1px solid ${T.line}`,background:T.navyTint}}>
              <div style={{...btnSt('primary'),justifyContent:'center'}}><Icon name="plus" size={13} color="#fff"/>Utiliser</div>
            </div>
          </button>)}
          {dbTemplates.length>0&&<>
            <div style={{fontSize:11,fontWeight:700,color:T.ink4,textTransform:'uppercase',letterSpacing:'.08em',marginTop:4}}>Modèles clients</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:14}}>
              {dbTemplates.map(t=><div key={t.id} style={{background:T.surface,border:`1px solid ${T.line}`,borderRadius:12,overflow:'hidden',cursor:'pointer',textAlign:'left',position:'relative'}} onClick={()=>setApplyModal(t)}>
                {isAdmin&&<button onClick={e=>{e.stopPropagation();setDeleteConfirm({type:'template',id:t.id,name:t.name});}} title="Supprimer" style={{position:'absolute',top:8,right:8,zIndex:3,width:22,height:22,borderRadius:'50%',background:'rgba(20,20,30,.55)',backdropFilter:'blur(4px)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',padding:0}}>
                  <Icon name="close" size={11} color="#fff"/>
                </button>}
                <div style={{aspectRatio:'297/210',background:T.panel,borderBottom:`1px solid ${T.lineSoft}`,position:'relative',overflow:'hidden'}}>
                  <MiniCover palette={t.palette} client={t.author||t.name} subtitle="MODÈLE CLIENT" clientLogoUrl={t.clientLogoUrl}/>
                </div>
                <div style={{padding:'12px 14px'}}>
                  <div style={{fontSize:13,fontWeight:600,color:T.ink}}>{t.name}</div>
                  <div style={{fontSize:11,color:T.ink4,marginTop:3}}>{t.author} · {t.updated}</div>
                </div>
              </div>)}
            </div>
          </>}
          {dbTemplates.length===0&&<div style={{background:T.panel,border:`1px solid ${T.lineSoft}`,borderRadius:10,padding:'14px 18px',display:'flex',alignItems:'center',gap:14}}>
            <div style={{width:32,height:32,borderRadius:8,background:T.goldTint,display:'grid',placeItems:'center',flexShrink:0}}><Icon name="folderTeam" size={16} color={T.gold}/></div>
            <div style={{flex:1}}><div style={{fontSize:12.5,fontWeight:600,color:T.ink}}>Aucun modèle client</div><div style={{fontSize:11,color:T.ink3,marginTop:2}}>En tant qu'admin, créez un projet et sauvegardez-le comme modèle via le bouton dans le configurateur.</div></div>
          </div>}
        </>}
      </div>}
      {tab==='shared'&&<div style={{padding:'60px 40px',textAlign:'center',background:T.surface,border:`1px solid ${T.lineSoft}`,borderRadius:12}}>
        <Icon name="share" size={32} color={T.ink3} style={{margin:'0 auto 16px'}}/>
        <div style={{fontSize:15,fontWeight:600,color:T.ink,marginBottom:6}}>Aucun projet partagé</div>
        <div style={{color:T.ink3,fontSize:12.5}}>Lorsqu'un collègue partagera un projet, il apparaîtra ici.</div>
      </div>}
    </div>
    {applyModal&&<TemplateApplyModal template={applyModal} onClose={()=>setApplyModal(null)} onConfirm={opts=>{setApplyModal(null);onOpenTemplate({...applyModal,...opts});}}/>}
    {updateModal&&<TemplateUpdateModal project={updateModal} onClose={()=>setUpdateModal(null)} onDecision={()=>setUpdateModal(null)}/>}
    {deleteConfirm&&<Scrim onClose={()=>setDeleteConfirm(null)}>
      <div onClick={e=>e.stopPropagation()} style={{background:T.surface,borderRadius:12,padding:28,width:340,boxShadow:'0 24px 60px rgba(0,0,0,.18)'}}>
        <div style={{fontSize:15,fontWeight:700,color:T.ink,marginBottom:6}}>Supprimer ce {deleteConfirm.type==='project'?'projet':'modèle'} ?</div>
        <div style={{fontSize:12.5,color:T.ink3,marginBottom:20}}>«{deleteConfirm.name}» sera supprimé définitivement.</div>
        <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
          <button onClick={()=>setDeleteConfirm(null)} style={btnSt()}>Annuler</button>
          <button onClick={handleDeleteConfirmed} style={{...btnSt('primary'),background:'#DC2626',borderColor:'#DC2626'}}>
            <Icon name="trash" size={13} color="#fff"/>Supprimer
          </button>
        </div>
      </div>
    </Scrim>}
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
      <div style={{position:'relative',zIndex:3,height:'20%',flexShrink:0,overflow:'hidden'}}>
        <AbraneLogoBox size="lg"/>
        {state.clientLogoUrl&&
          <img src={state.clientLogoUrl} alt={state.client}
            style={{position:'absolute',left:`${state.logoX??80}%`,top:`${state.logoY??5}%`,height:`${state.logoScale}%`,maxHeight:'90%',maxWidth:'55%',objectFit:'contain',display:'block',transform:'translate(-50%,-50%)'}}/>
        }
      </div>
      <div style={{position:'absolute',top:'26%',left:isRing?'12%':'0',right:'0',height:'44%',zIndex:1,overflow:'hidden',
        ...(state.bgImageUrl?{backgroundImage:`url(${state.bgImageUrl})`,backgroundSize:`${state.bgScale??100}%`,backgroundPosition:`${state.bgX??50}% ${state.bgY??50}%`,backgroundRepeat:'no-repeat',opacity:.20}:{})
      }}>
        {!state.bgImageUrl&&<div style={{width:'100%',height:'100%',background:`repeating-linear-gradient(135deg,${p.c1} 0 14px,${shade(p.c1,-6)} 14px 28px)`,opacity:.6}}/>}
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
    <div style={{background:'#fff',borderLeft:`3px solid ${p.c2}`,display:'flex',flexDirection:'column',alignItems:'center',paddingTop:'5%',gap:8,overflow:'hidden'}}>
    </div>
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
  if(state.enMat)pgN+=Math.ceil(state.thumbCount/12);
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

function ContentPage({state,file,pageIdx,isPortrait,isRing,rotation,pageUrl,pageKey,ordId}) {
  const p=state.palette,isNotes=state.pageFormat.includes('notes');
  const rot=rotation||0;
  const hasAnn=!!(state.annotations?.[pageKey]);
  const displayUrl=state.annotSnaps?.[pageKey]||pageUrl;
  const cZoom=state.contentZoom?.[pageKey]??90;
  const cX=state.contentPos?.[pageKey]?.x??50;
  const cY=state.contentPos?.[pageKey]?.y??50;
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
    <div style={{position:'absolute',top:0,right:0,bottom:0,width:'8%',background:'#fff',borderLeft:`3px solid ${p.c2}`,display:'flex',flexDirection:'column',alignItems:'center',paddingTop:'5%',gap:8,overflow:'hidden'}}>
      <StripeAbraneLogo/>
      {state.clientLogoUrl&&<img src={state.clientLogoUrl} alt={state.client} style={{width:`${state.stripeLogoScale||80}%`,objectFit:'contain',display:'block',flexShrink:0,marginTop:`${state.stripeLogoY||0}%`}}/>}
    </div>
    {/* Image zone — objectFit:contain so it adapts to any page format automatically */}
    <div style={{position:'absolute',top:'3%',right:'11%',bottom:isNotes?'21%':'4%',left:isRing?'14%':'4%',overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center'}}>
      {displayUrl
        ?<img src={displayUrl} alt={file.name} style={{maxWidth:'100%',maxHeight:'100%',objectFit:'contain',transform:`scale(${cZoom/100})${rot?` rotate(${rot}deg)`:''}`,transformOrigin:`${cX}% ${cY}%`,transition:'transform .2s'}}/>
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
  const p=state.palette,cols=isPortrait?4:6,perPage=12;
  const totalPages=Math.max(1,Math.ceil(state.thumbCount/perPage));
  const start=pageIndex*perPage;
  const end=Math.min(start+perPage,state.thumbCount);
  const cells=state.materials.slice(start,end).filter(Boolean);
  const fixedRows=Math.ceil(perPage/cols);
  return <div style={{width:'100%',aspectRatio:isPortrait?'210/297':'297/210',background:'#fff',padding:isRing?'3% 2% 3% 9%':'3% 2%',position:'relative',overflow:'hidden',boxSizing:'border-box'}}>
    <div style={{fontSize:10,letterSpacing:'.18em',textTransform:'uppercase',marginBottom:'1.6%',color:p.c3}}>
      MATÉRIAUX{totalPages>1?` · ${pageIndex+1}/${totalPages}`:''}
    </div>
    <div style={{display:'grid',gridTemplateColumns:`repeat(${cols},1fr)`,gridTemplateRows:`repeat(${fixedRows},1fr)`,gap:5,height:'90%'}}>
      {cells.map((m,i)=>(
        <div key={i} style={{border:`1px solid ${p.c1}`,display:'flex',flexDirection:'column',overflow:'hidden'}}>
          <div style={{flex:'1 1 0',minHeight:0,position:'relative',overflow:'hidden'}}>
            {m.imgUrl
              ?<img src={m.imgUrl} alt={m.mat} style={{display:'block',position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',objectPosition:'center'}}/>
              :<div style={{position:'absolute',inset:0,background:`linear-gradient(135deg,${shade(p.c1,4)} 0 50%,${p.c1} 50% 100%)`}}/>
            }
          </div>
          <div style={{flexShrink:0,padding:'3px 5px',background:'#fff',borderTop:`1px solid ${p.c1}`,overflow:'hidden'}}>
            <div style={{fontSize:9,fontWeight:700,color:p.c3,overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis'}}>{m.mat}</div>
            <div style={{fontSize:8,color:shade(p.c3,40),overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis'}}>{m.fin}</div>
          </div>
        </div>
      ))}
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
      <div style={{marginLeft:'auto',marginBottom:8,display:'inline-block'}}><AbraneLogoBox size="sm"/></div>
      {state.backLines.map((l,i)=><div key={i}>{l}</div>)}
    </div>
    <div style={{position:'absolute',right:0,bottom:0,width:'48%',height:'50%',overflow:'hidden',
      ...(state.bgImageUrl?{backgroundImage:`url(${state.bgImageUrl})`,backgroundSize:`${state.bgScale??100}%`,backgroundPosition:`${state.bgX??50}% ${state.bgY??50}%`,backgroundRepeat:'no-repeat',opacity:.45}:{})
    }}>
      {!state.bgImageUrl&&<div style={{width:'100%',height:'100%',background:`repeating-linear-gradient(135deg,${shade(p.c1,4)} 0 14px,${p.c1} 14px 28px)`,opacity:.35}}/>}
    </div>
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
    const nPgs=Math.max(1,Math.ceil(s.thumbCount/12));
    for(let i=0;i<nPgs;i++) pages.push({key:'mat'+i,type:'materials',label:'Matériaux',pageIndex:i});
  }
  if(s.enNotes) pages.push({key:'notes0',type:'notes',label:'Notes'});
  s.contentOrder.forEach(it=>{
    if(it.type==='cat') pages.push({key:'cat-'+it.id,type:'category',label:it.name,catName:it.name});
    else{const f=s.files.find(x=>x.id===it.fileId);if(!f)return;const dn=it.label||f.name.replace(/\.[^.]+$/,'');for(let i=0;i<(f.pages||1);i++)pages.push({key:'f-'+it.id+'-'+i,type:'content',label:dn,file:f,pageIdx:i,ordId:it.id,rotation:(it.pageRotations?.[i]??it.rotation)??0,pageUrl:(f.pageUrls&&f.pageUrls[i])||null});}
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
    case 'content':   return <ContentPage state={state} file={page.file} pageIdx={page.pageIdx} isPortrait={isP} isRing={isR} rotation={page.rotation} pageUrl={page.pageUrl} pageKey={page.key} ordId={page.ordId}/>;
    case 'notes':     return <NotesPage   state={state} isPortrait={isP} isRing={isR} noteIdx={page.noteIdx||0}/>;
    case 'back':      return <BackPage    state={state} isPortrait={isP} isRing={isR}/>;
    default: return null;
  }
}

function PdfExportModal({state,onClose}) {
  const [quality,setQuality]=useState('standard');
  const [withAnnot,setWithAnnot]=useState(true);
  const [exporting,setExporting]=useState(false);
  const [done,setDone]=useState(0);
  const abortRef=useRef(false);
  const brandCtx=React.useContext(BrandCtx);
  const pages=useMemo(()=>buildPageList(state),[state]);
  const cfg=PDF_QUALITY.find(q=>q.id===quality);

  const isP=state.pageFormat.startsWith('v');
  const BW=isP?794:1123, BH=isP?1123:794;

  const doExport=useCallback(async()=>{
    abortRef.current=false;
    setExporting(true);
    setDone(0);
    const exportState=withAnnot?state:{...state,annotSnaps:{}};
    let el=null,root=null;
    try{
      const [{jsPDF},{default:h2c}]=await Promise.all([import('jspdf'),import('html2canvas')]);
      const pdf=new jsPDF({orientation:isP?'portrait':'landscape',unit:'mm',format:'a4',compress:true});
      for(let i=0;i<pages.length;i++){
        if(abortRef.current) break;
        el=document.createElement('div');
        el.style.cssText=`position:absolute;left:-${BW*4}px;top:0;width:${BW}px;height:${BH}px;overflow:hidden;pointer-events:none;font-family:-apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif;`;
        document.body.appendChild(el);
        root=createRoot(el);
        root.render(
          <BrandCtx.Provider value={brandCtx}>
            <NotesEditCtx.Provider value={null}>
              <PageRender page={pages[i]} state={exportState}/>
            </NotesEditCtx.Provider>
          </BrandCtx.Provider>
        );
        await new Promise(r=>setTimeout(r,280));
        if(abortRef.current){root.unmount();document.body.removeChild(el);el=null;root=null;break;}
        const canvas=await h2c(el,{scale:cfg.scale,useCORS:true,allowTaint:true,logging:false,width:BW,height:BH,windowWidth:BW,windowHeight:BH,imageTimeout:5000});
        if(i>0) pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/jpeg',cfg.q),'JPEG',0,0,isP?210:297,isP?297:210);
        root.unmount();document.body.removeChild(el);el=null;root=null;
        setDone(i+1);
      }
      if(!abortRef.current){
        pdf.save((state.name||'catalogue').replace(/[^a-z0-9]/gi,'_')+'.pdf');
        setTimeout(onClose,400);
      }
    }catch(e){alert('Erreur export PDF : '+e.message);}
    finally{
      if(el){try{root?.unmount();document.body.removeChild(el);}catch(_){}}
      setExporting(false);
    }
  },[state,isP,BW,BH,quality,withAnnot,pages,brandCtx,cfg,onClose]);

  return(
    <Scrim onClose={exporting?()=>{}:onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:T.surface,borderRadius:12,padding:28,width:420,boxShadow:'0 24px 60px rgba(0,0,0,.18)'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
          <div style={{fontSize:15,fontWeight:700,color:T.ink}}>Exporter en PDF</div>
          {!exporting&&<button onClick={onClose} style={{background:'transparent',border:'none',cursor:'pointer',padding:4,display:'grid',placeItems:'center'}}><Icon name="close" size={16} color={T.ink3}/></button>}
        </div>

        <div style={{fontSize:11,fontWeight:600,color:T.ink4,letterSpacing:'.05em',textTransform:'uppercase',marginBottom:8,fontFamily:'inherit'}}>Qualité</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6,marginBottom:18}}>
          {PDF_QUALITY.map(q=>(
            <button key={q.id} onClick={()=>!exporting&&setQuality(q.id)}
              style={{padding:'10px 8px',borderRadius:8,border:`2px solid ${quality===q.id?T.navy:T.line}`,background:quality===q.id?T.navyTint:T.panel,cursor:exporting?'default':'pointer',textAlign:'center',fontFamily:'inherit'}}>
              <div style={{fontSize:13,fontWeight:700,color:quality===q.id?T.navy:T.ink,marginBottom:3,fontFamily:'inherit'}}>{q.label}</div>
              <div style={{fontSize:10,color:T.ink4,lineHeight:1.35,fontFamily:'inherit'}}>{q.sub}</div>
            </button>
          ))}
        </div>

        <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',background:T.panel,borderRadius:8,border:`1px solid ${T.lineSoft}`,marginBottom:18,cursor:exporting?'default':'pointer'}}
          onClick={()=>!exporting&&setWithAnnot(v=>!v)}>
          <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${withAnnot?T.navy:T.line}`,background:withAnnot?T.navy:'transparent',display:'grid',placeItems:'center',flexShrink:0,transition:'.15s'}}>
            {withAnnot&&<Icon name="check" size={11} color="#fff" stroke={3}/>}
          </div>
          <div>
            <div style={{fontSize:12.5,fontWeight:500,color:T.ink,fontFamily:'inherit'}}>Inclure les annotations</div>
            <div style={{fontSize:11,color:T.ink4,fontFamily:'inherit'}}>Les calques annotés sont superposés sur les pages</div>
          </div>
        </div>

        <div style={{fontSize:12,color:T.ink3,marginBottom:exporting?12:20,fontFamily:'inherit'}}>
          {pages.length} pages · {isP?'A4 Portrait':'A4 Paysage'}</div>

        {exporting&&<div style={{marginBottom:18}}>
          <div style={{height:6,background:T.panel,borderRadius:3,overflow:'hidden',marginBottom:6}}>
            <div style={{height:'100%',width:`${pages.length?Math.round(done/pages.length*100):0}%`,background:T.navy,borderRadius:3,transition:'width .25s'}}/>
          </div>
          <div style={{fontSize:11,color:T.ink4,textAlign:'center',fontFamily:'inherit'}}>Page {done} / {pages.length}…</div>
        </div>}

        <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
          <button onClick={()=>{if(exporting){abortRef.current=true;}else{onClose();}}} style={{...btnSt(),fontFamily:'inherit'}}>
            {exporting?'Annuler':'Fermer'}
          </button>
          <button onClick={doExport} disabled={exporting}
            style={{...btnSt('primary'),opacity:exporting?.6:1,fontFamily:'inherit'}}>
            <Icon name={exporting?'history':'pdf'} size={13} color="#fff"/>
            {exporting?'Export en cours…':'Exporter PDF'}
          </button>
        </div>
      </div>
    </Scrim>
  );
}

function Canvas({state,zoom,setZoom,activePage,onAnnotate,paletteH,onUpdatePageNotes}) {
  const {wmLogo,stampLogo}=React.useContext(BrandCtx);
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

  return <main ref={canvasRef} style={{flex:1,minWidth:0,overflowY:'auto',background:T.bg,display:'flex',flexDirection:'column',alignItems:'center',padding:`0 32px ${botPad}px`,position:'relative'}}>
    <div style={{width:'100%',maxWidth:isP?700:1000,display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:18,flexShrink:0,position:'sticky',top:0,zIndex:10,background:T.bg,paddingTop:10,paddingBottom:10}}>
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
            {state.wmEnabled&&(
              <div style={{position:'absolute',inset:0,overflow:'hidden',pointerEvents:'none',zIndex:6}}>
                <div style={{position:'absolute',inset:'-80%',display:'grid',gridTemplateColumns:'repeat(7,1fr)',gridTemplateRows:'repeat(12,1fr)',transform:'rotate(-40deg)',transformOrigin:'center',opacity:state.wmOpacity/100}}>
                  {Array.from({length:84}).map((_,k)=>(
                    <div key={k} style={{display:'flex',alignItems:'center',justifyContent:'center',padding:'3%'}}>
                      {wmLogo
                        ?<img src={wmLogo} alt="" style={{maxWidth:'100%',maxHeight:'100%',objectFit:'contain',userSelect:'none'}}/>
                        :<span style={{fontWeight:900,letterSpacing:'.18em',fontSize:'clamp(3px,0.75vw,7px)',color:'#1A1F2E',whiteSpace:'nowrap',userSelect:'none',fontFamily:'inherit'}}>ABRANE</span>
                      }
                    </div>
                  ))}
                </div>
              </div>
            )}
            {state.sigEnabled&&state.sigUrl&&(()=>{
              const pl=state.sigPlacement||'all';
              const show=pl==='all'||(pl==='first'&&i===0)||(pl==='last'&&i===pages.length-1)||(pl==='content'&&p.type==='content');
              return show?(
                <div style={{position:'absolute',left:`${state.sigX??78}%`,top:`${state.sigY??88}%`,transform:'translate(-50%,-50%)',zIndex:8,pointerEvents:'none',width:`${state.sigScale??30}%`,maxWidth:'40%'}}>
                  <img src={state.sigUrl} alt="" style={{width:'100%',objectFit:'contain',opacity:0.9}}/>
                </div>
              ):null;
            })()}
            {state.stampEnabled&&stampLogo&&(()=>{
              const pl=state.stampPlacement||'all';
              const show=pl==='all'||(pl==='first'&&i===0)||(pl==='last'&&i===pages.length-1)||(pl==='content'&&p.type==='content');
              return show?(
                <div style={{position:'absolute',left:`${state.stampX??50}%`,top:`${state.stampY??50}%`,transform:'translate(-50%,-50%)',zIndex:7,pointerEvents:'none',width:`${state.stampScale??25}%`,maxWidth:'50%'}}>
                  <img src={stampLogo} alt="" style={{width:'100%',objectFit:'contain',opacity:(state.stampOpacity??70)/100}}/>
                </div>
              ):null;
            })()}
            {state.symEnabled&&(()=>{
              const pl=state.symPlacement||'all';
              const show=pl==='all'||(pl==='first'&&i===0)||(pl==='last'&&i===pages.length-1)||(pl==='content'&&p.type==='content')||(pl==='specific'&&i===(state.symPageNum??1)-1);
              return show?(
                <div style={{position:'absolute',left:`${state.symX??50}%`,top:`${state.symY??50}%`,transform:'translate(-50%,-50%)',zIndex:9,pointerEvents:'none',width:`${state.symScale??20}%`,maxWidth:'35%',display:'flex',flexDirection:'column',alignItems:'center',gap:'6%'}}>
                  <svg viewBox="0 0 100 90" style={{width:'68%',display:'block',overflow:'visible',filter:'drop-shadow(0 2px 4px rgba(0,0,0,.25))'}}>
                    <polygon points="50,4 96,86 4,86" fill="#DC2626" stroke="#fff" strokeWidth="3" strokeLinejoin="round"/>
                    <text x="50" y="74" textAnchor="middle" fontWeight="900" fontSize="54" fill="#fff" fontFamily="Arial,Helvetica,sans-serif">!</text>
                  </svg>
                  {state.symText&&<div style={{fontSize:'clamp(6px,2vw,16px)',fontWeight:700,color:'#DC2626',textAlign:'center',lineHeight:1.2,wordBreak:'break-word',width:'160%'}}>{state.symText}</div>}
                </div>
              ):null;
            })()}
            {state.advEnabled&&(()=>{
              const pl=state.advPlacement||'all';
              const show=pl==='all'||(pl==='first'&&i===0)||(pl==='last'&&i===pages.length-1)||(pl==='content'&&p.type==='content')||(pl==='specific'&&i===(state.advPageNum??1)-1);
              const st=ADV_STATUSES.find(s=>s.v===(state.advStatus||'AF'))||ADV_STATUSES[0];
              return show?(
                <div style={{position:'absolute',left:`${state.advX??85}%`,top:`${state.advY??8}%`,transform:'translate(-50%,-50%)',zIndex:9,pointerEvents:'none',width:`${state.advScale??15}%`,maxWidth:'28%'}}>
                  <div style={{background:st.color+'28',border:`2px solid ${st.color}`,borderRadius:8,padding:'8% 12%',display:'flex',flexDirection:'column',alignItems:'center',gap:'5%',boxShadow:'0 2px 8px rgba(0,0,0,.18)'}}>
                    <span style={{fontSize:'clamp(7px,2vw,18px)',lineHeight:1}}>{st.emoji}</span>
                    <span style={{fontSize:'clamp(12px,3.3vw,27px)',fontWeight:900,color:st.color,letterSpacing:'.08em',lineHeight:1}}>{st.v}</span>
                    <span style={{fontSize:'clamp(9px,2.25vw,18px)',fontWeight:600,color:st.color,textAlign:'center',lineHeight:1.25}}>{st.l}</span>
                  </div>
                </div>
              ):null;
            })()}
            {state.disclaimerEnabled&&(()=>{
              const pl=state.disclaimerPlacement||'all';
              const show=pl==='all'||(pl==='first'&&i===0)||(pl==='last'&&i===pages.length-1)||(pl==='content'&&p.type==='content')||(pl==='specific'&&i===(state.disclaimerPageNum??1)-1);
              const sz=state.disclaimerSize??6;
              const lang=state.disclaimerLang||'fr';
              const FR='Tous les dessins techniques et documents associés sont la propriété exclusive de ABRANE France S.A.S. Toute reproduction ou utilisation sans autorisation est interdite.';
              const EN='All technical drawings and associated documents are the exclusive property of ABRANE France S.A.S. Any reproduction or use without authorization is prohibited.';
              const txt=lang==='both'?`${FR}\n${EN}`:lang==='en'?EN:FR;
              return show?(
                <div style={{position:'absolute',left:`${state.disclaimerX??50}%`,top:`${state.disclaimerY??95}%`,transform:'translate(-50%,-50%)',zIndex:8,pointerEvents:'none',width:'88%',textAlign:'center'}}>
                  {txt.split('\n').map((line,li)=>(
                    <div key={li} style={{fontSize:`clamp(2px,${sz*0.09}vw,${sz}pt)`,color:'rgba(0,0,0,0.3)',fontStyle:'italic',lineHeight:1.5,letterSpacing:'.01em',marginTop:li?'0.3em':0}}>{line}</div>
                  ))}
                </div>
              ):null;
            })()}
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
      {state.clientLogoUrl&&<>
        <Fld label={`Taille logo couverture · ${state.logoScale}%`}>
          <input type="range" min="20" max="300" value={state.logoScale} onChange={e=>update({logoScale:parseInt(e.target.value)})} style={{width:'100%',accentColor:T.navy}}/>
        </Fld>
        <Fld label={`Position X couverture · ${state.logoX??80}%`}>
          <input type="range" min="0" max="100" value={state.logoX??80} onChange={e=>update({logoX:parseInt(e.target.value)})} style={{width:'100%',accentColor:T.navy}}/>
        </Fld>
        <Fld label={`Position Y couverture · ${state.logoY??5}%`}>
          <input type="range" min="0" max="100" value={state.logoY??5} onChange={e=>update({logoY:parseInt(e.target.value)})} style={{width:'100%',accentColor:T.navy}}/>
        </Fld>
        <Fld label={`Taille logo pages contenu · ${state.stripeLogoScale||80}%`}>
          <input type="range" min="20" max="100" value={state.stripeLogoScale||80} onChange={e=>update({stripeLogoScale:parseInt(e.target.value)})} style={{width:'100%',accentColor:T.navy}}/>
        </Fld>
        <Fld label={`Position verticale pages contenu · ${state.stripeLogoY||0}%`}>
          <input type="range" min="0" max="70" value={state.stripeLogoY||0} onChange={e=>update({stripeLogoY:parseInt(e.target.value)})} style={{width:'100%',accentColor:T.navy}}/>
        </Fld>
      </>}
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
  const perPage=12;
  const numPages=Math.max(1,Math.ceil(state.thumbCount/perPage));
  const twoPages=numPages>1;

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
      <RowItem label="Activer la page Matériaux" sub="Jusqu'à 36 vignettes (nouvelle page tous les 12)">
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
          {state.thumbCount} vignettes · {numPages} pages générées automatiquement
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
function ContentPanel({state,update,onNavigate}) {
  const fileInputRef=useRef(null);
  const [dragIdx,setDragIdx]=useState(null);
  const [overIdx,setOverIdx]=useState(null);
  const [renaming,setRenaming]=useState(null);
  const [importing,setImporting]=useState(false);
  const [expandedZoom,setExpandedZoom]=useState({});
  const toggleZoom=id=>setExpandedZoom(z=>({...z,[id]:!z[id]}));

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

  const setRotation=(ordId,deg,pageIdx)=>{
    update({contentOrder:state.contentOrder.map(x=>{
      if(x.id!==ordId)return x;
      if(pageIdx===undefined) return {...x,rotation:deg};
      return {...x,pageRotations:{...(x.pageRotations||{}),[pageIdx]:deg}};
    })});
  };
  const setContentZoom=(ordId,val)=>update({contentZoom:{...(state.contentZoom||{}),[ordId]:val}});
  const setContentPos=(ordId,x,y)=>update({contentPos:{...(state.contentPos||{}),[ordId]:{x,y}}});

  const goToItem=item=>{
    if(!onNavigate)return;
    const pages=buildPageList(state);
    const idx=item.type==='cat'
      ?pages.findIndex(p=>p.key==='cat-'+item.id)
      :pages.findIndex(p=>p.ordId===item.id);
    if(idx>=0) onNavigate(idx);
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
                <div style={{display:'flex',alignItems:'center',gap:2}}>
                  {onNavigate&&<button onClick={e=>{e.stopPropagation();goToItem(item);}}
                    title="Aller à cette page"
                    style={{background:'transparent',border:'none',padding:'3px',cursor:'pointer',borderRadius:4,display:'grid',placeItems:'center'}}>
                    <Icon name="eye" size={12} color={T.navy}/>
                  </button>}
                  <button onClick={e=>{e.stopPropagation();handleDelete(item.id);}}
                    style={{background:'transparent',border:'none',padding:'3px',cursor:'pointer',borderRadius:4,display:'grid',placeItems:'center'}}>
                    <Icon name="trash" size={12} color={T.ink4}/>
                  </button>
                </div>
              </div>
              {/* Controls — only for files */}
              {!isCat&&(
                <div
                  style={{marginTop:6,paddingLeft:47}}
                  onMouseDown={e=>e.stopPropagation()}
                  onDragStart={e=>{e.stopPropagation();e.preventDefault();}}
                  draggable={false}
                >
                  {Array.from({length:f.pages},(_,pi)=>{
                    const pKey='f-'+item.id+'-'+pi;
                    const pr=item.pageRotations?.[pi]??item.rotation??0;
                    const pcz=state.contentZoom?.[pKey]??90;
                    const pcx=state.contentPos?.[pKey]?.x??50;
                    const pcy=state.contentPos?.[pKey]?.y??50;
                    const zoomKey=item.id+'-'+pi;
                    const zOpen=!!expandedZoom[zoomKey];
                    const hasCustomZoom=pcz!==90||pcx!==50||pcy!==50;
                    return(
                      <div key={pi} style={{marginBottom:pi<f.pages-1?8:0,paddingBottom:pi<f.pages-1?8:0,borderBottom:pi<f.pages-1?`1px dashed ${T.lineSoft}`:'none'}}>
                        {f.pages>1&&<span style={{fontSize:8.5,fontWeight:600,color:T.ink4,display:'block',marginBottom:3}}>Page {pi+1}</span>}
                        {/* Rotation + zoom toggle on same row */}
                        <div style={{display:'flex',alignItems:'center',gap:3}}>
                          <Icon name="rotateCW" size={9} color={T.ink5}/>
                          {[0,90,180,270].map(deg=>(
                            <button key={deg} onClick={e=>{e.stopPropagation();setRotation(item.id,deg,f.pages===1?undefined:pi);}} style={rotBtnSt(pr===deg)}>{deg}°</button>
                          ))}
                          <button
                            onClick={e=>{e.stopPropagation();toggleZoom(zoomKey);}}
                            title="Zoom & position"
                            style={{marginLeft:'auto',padding:'2px 5px',fontSize:9,fontWeight:600,lineHeight:1,border:`1px solid ${zOpen||hasCustomZoom?T.navy:T.lineSoft}`,borderRadius:3,cursor:'pointer',background:zOpen?T.navy:hasCustomZoom?T.navyTint:'transparent',color:zOpen?'#fff':hasCustomZoom?T.navy:T.ink4,display:'flex',alignItems:'center',gap:2}}
                          >
                            ⤢ {hasCustomZoom&&!zOpen?`${pcz}%`:'Zoom'}
                          </button>
                        </div>
                        {/* Collapsible zoom/position sliders */}
                        {zOpen&&(
                          <div style={{marginTop:5,display:'flex',flexDirection:'column',gap:3}}>
                            <div style={{display:'flex',alignItems:'center',gap:4}}>
                              <span style={{fontSize:9,color:T.ink5,minWidth:52,flexShrink:0}}>Zoom {pcz}%</span>
                              <input type="range" min="30" max="300" value={pcz} onChange={e=>setContentZoom(pKey,parseInt(e.target.value))} style={{flex:1,accentColor:T.navy}}/>
                              <button onClick={e=>{e.stopPropagation();setContentZoom(pKey,90);}} style={{fontSize:8,padding:'1px 4px',border:`1px solid ${T.lineSoft}`,borderRadius:3,cursor:'pointer',background:'transparent',color:T.ink4,flexShrink:0}}>↺</button>
                            </div>
                            <div style={{display:'flex',alignItems:'center',gap:4}}>
                              <span style={{fontSize:9,color:T.ink5,minWidth:52,flexShrink:0}}>Cadrage H {pcx}%</span>
                              <input type="range" min="0" max="100" value={pcx} onChange={e=>setContentPos(pKey,parseInt(e.target.value),pcy)} style={{flex:1,accentColor:T.navy}}/>
                            </div>
                            <div style={{display:'flex',alignItems:'center',gap:4}}>
                              <span style={{fontSize:9,color:T.ink5,minWidth:52,flexShrink:0}}>Cadrage V {pcy}%</span>
                              <input type="range" min="0" max="100" value={pcy} onChange={e=>setContentPos(pKey,pcx,parseInt(e.target.value))} style={{flex:1,accentColor:T.navy}}/>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
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
function SignPanel({state,update,user}) {
  const canvasRef=useRef(null);
  const drawing=useRef(false);
  const [mode,setMode]=useState('draw');

  const sigKey=user?'abrane_sig_'+user.id:null;
  const savedSig=sigKey?localStorage.getItem(sigKey)||'':'';
  const [sigImg,setSigImg]=useState(savedSig);

  // Sync saved signature into state on mount so it appears on pages
  useEffect(()=>{
    if(savedSig&&!state.sigUrl) update({sigUrl:savedSig});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  const px=e=>e.touches?e.touches[0].clientX:e.clientX;
  const py=e=>e.touches?e.touches[0].clientY:e.clientY;

  const startDraw=e=>{
    e.preventDefault();
    drawing.current=true;
    const c=canvasRef.current,r=c.getBoundingClientRect();
    const ctx=c.getContext('2d');
    ctx.beginPath();
    ctx.moveTo((px(e)-r.left)*(c.width/r.width),(py(e)-r.top)*(c.height/r.height));
  };
  const draw=e=>{
    e.preventDefault();
    if(!drawing.current)return;
    const c=canvasRef.current,r=c.getBoundingClientRect();
    const ctx=c.getContext('2d');
    ctx.lineTo((px(e)-r.left)*(c.width/r.width),(py(e)-r.top)*(c.height/r.height));
    ctx.strokeStyle='#1A1F2E';ctx.lineWidth=2;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();
  };
  const stopDraw=()=>{drawing.current=false;};

  const clear=()=>{
    const c=canvasRef.current;
    c.getContext('2d').clearRect(0,0,c.width,c.height);
  };
  const saveSig=()=>{
    const url=canvasRef.current.toDataURL('image/png');
    if(sigKey) localStorage.setItem(sigKey,url);
    setSigImg(url);
    update({sigUrl:url,sigEnabled:true});
  };
  const deleteSig=()=>{
    if(sigKey) localStorage.removeItem(sigKey);
    setSigImg('');
    update({sigUrl:'',sigEnabled:false});
  };
  const uploadSig=e=>{
    const f=e.target.files?.[0];if(!f)return;
    const r=new FileReader();
    r.onload=ev=>{
      const url=ev.target.result;
      if(sigKey) localStorage.setItem(sigKey,url);
      setSigImg(url);
      update({sigUrl:url,sigEnabled:true});
    };
    r.readAsDataURL(f);
  };

  const PLACEMENTS=[{v:'all',l:'Toutes les pages'},{v:'first',l:'Couverture uniquement'},{v:'last',l:'Dernière page uniquement'},{v:'content',l:'Pages contenu uniquement'}];

  return <>
    <Sect title="Signature">
      <RowItem label="Activer la signature" sub={user?`Profil : ${user.name}`:'Aucun profil'}>
        <Toggle checked={state.sigEnabled} onChange={v=>update({sigEnabled:v})}/>
      </RowItem>
      {state.sigEnabled&&<>
        <Fld label="Appliquer sur">
          <div style={{display:'flex',flexDirection:'column',gap:4}}>
            {PLACEMENTS.map(pl=>(
              <label key={pl.v} style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:12,color:T.ink}}>
                <input type="radio" name="sigPlacement" value={pl.v} checked={(state.sigPlacement||'all')===pl.v} onChange={()=>update({sigPlacement:pl.v})} style={{accentColor:T.navy}}/>
                {pl.l}
              </label>
            ))}
          </div>
        </Fld>
        <Fld label={`Taille · ${state.sigScale??30}%`}>
          <input type="range" min="5" max="60" value={state.sigScale??30} onChange={e=>update({sigScale:parseInt(e.target.value)})} style={{width:'100%',accentColor:T.navy}}/>
        </Fld>
        <Fld label={`Position horizontale · ${state.sigX??78}%`}>
          <input type="range" min="0" max="100" value={state.sigX??78} onChange={e=>update({sigX:parseInt(e.target.value)})} style={{width:'100%',accentColor:T.navy}}/>
        </Fld>
        <Fld label={`Position verticale · ${state.sigY??88}%`}>
          <input type="range" min="0" max="100" value={state.sigY??88} onChange={e=>update({sigY:parseInt(e.target.value)})} style={{width:'100%',accentColor:T.navy}}/>
        </Fld>
      </>}
      {sigImg
        ?<div style={{border:`1px solid ${T.line}`,borderRadius:8,overflow:'hidden',background:'#fafaf8'}}>
            <img src={sigImg} alt="Signature" style={{width:'100%',display:'block',maxHeight:90,objectFit:'contain',padding:8,boxSizing:'border-box'}}/>
            <div style={{display:'flex',gap:6,padding:'6px 8px',borderTop:`1px solid ${T.lineSoft}`}}>
              <button onClick={deleteSig} style={{...btnSt(undefined,true),flex:1,justifyContent:'center',color:'#C53030',borderColor:'#FECACA'}}>Supprimer</button>
            </div>
          </div>
        :<>
          <div style={{display:'flex',gap:4,marginBottom:6}}>
            {['draw','upload'].map(m=><button key={m} onClick={()=>setMode(m)} style={{...btnSt(mode===m?'primary':'default',true),flex:1,justifyContent:'center'}}>
              {m==='draw'?'Dessiner':'Importer'}
            </button>)}
          </div>
          {mode==='draw'
            ?<>
              <canvas ref={canvasRef} width={560} height={180}
                style={{border:`1.5px solid ${T.lineStrong}`,borderRadius:8,background:'#fff',cursor:'crosshair',touchAction:'none',width:'100%',display:'block'}}
                onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
                onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}
              />
              <div style={{display:'flex',gap:6,marginTop:6}}>
                <button onClick={clear} style={{...btnSt(undefined,true),flex:1,justifyContent:'center'}}>Effacer</button>
                <button onClick={saveSig} style={{...btnSt('primary',true),flex:1,justifyContent:'center'}}><Icon name="check" size={12} color="#fff"/>Enregistrer</button>
              </div>
            </>
            :<label style={{...btnSt(undefined,false),cursor:'pointer',justifyContent:'center',width:'100%',boxSizing:'border-box'}}>
              <Icon name="upload" size={13} color={T.ink}/>Choisir une image
              <input type="file" accept="image/*" style={{display:'none'}} onChange={uploadSig}/>
            </label>
          }
        </>
      }
    </Sect>
    <Sect title="Filigrane">
      <RowItem label="Filigrane ABRANE" sub="Répété en diagonale sur toutes les pages">
        <Toggle checked={state.wmEnabled} onChange={v=>update({wmEnabled:v})}/>
      </RowItem>
      {state.wmEnabled&&<Fld label={`Opacité ${state.wmOpacity}%`}>
        <input type="range" min="3" max="80" value={state.wmOpacity} onChange={e=>update({wmOpacity:parseInt(e.target.value)})} style={{width:'100%',accentColor:T.navy}}/>
      </Fld>}
    </Sect>
    <Sect title="Tampon d'entreprise">
      <RowItem label="Activer le tampon d'entreprise" sub="Image chargée par l'administrateur">
        <Toggle checked={state.stampEnabled} onChange={v=>update({stampEnabled:v})}/>
      </RowItem>
      {state.stampEnabled&&<>
        <Fld label="Appliquer sur">
          <div style={{display:'flex',flexDirection:'column',gap:4}}>
            {PLACEMENTS.map(pl=>(
              <label key={pl.v} style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:12,color:T.ink}}>
                <input type="radio" name="stampPlacement" value={pl.v} checked={(state.stampPlacement||'all')===pl.v} onChange={()=>update({stampPlacement:pl.v})} style={{accentColor:T.navy}}/>
                {pl.l}
              </label>
            ))}
          </div>
        </Fld>
        <Fld label={`Opacité · ${state.stampOpacity??70}%`}>
          <input type="range" min="5" max="100" value={state.stampOpacity??70} onChange={e=>update({stampOpacity:parseInt(e.target.value)})} style={{width:'100%',accentColor:T.navy}}/>
        </Fld>
        <Fld label={`Taille · ${state.stampScale??25}%`}>
          <input type="range" min="5" max="70" value={state.stampScale??25} onChange={e=>update({stampScale:parseInt(e.target.value)})} style={{width:'100%',accentColor:T.navy}}/>
        </Fld>
        <Fld label={`Position horizontale · ${state.stampX??50}%`}>
          <input type="range" min="0" max="100" value={state.stampX??50} onChange={e=>update({stampX:parseInt(e.target.value)})} style={{width:'100%',accentColor:T.navy}}/>
        </Fld>
        <Fld label={`Position verticale · ${state.stampY??50}%`}>
          <input type="range" min="0" max="100" value={state.stampY??50} onChange={e=>update({stampY:parseInt(e.target.value)})} style={{width:'100%',accentColor:T.navy}}/>
        </Fld>
      </>}
    </Sect>
  </>;
}
const ADV_STATUSES=[
  {v:'AF',  l:'À faire',                  emoji:'⏳', color:'#6B7280'},
  {v:'EC',  l:'En cours',                 emoji:'🔄', color:'#3B82F6'},
  {v:'DEV', l:'En développement',         emoji:'🛠️', color:'#8B5CF6'},
  {v:'ATT', l:'En attente',               emoji:'⏸️', color:'#F97316'},
  {v:'EAV', l:'En attente de validation', emoji:'🟡', color:'#EAB308'},
  {v:'AV',  l:'À valider',                emoji:'📋', color:'#64748B'},
  {v:'VAL', l:'Validé',                   emoji:'✅', color:'#16A34A'},
  {v:'REF', l:'Refusé',                   emoji:'❌', color:'#EF4444'},
  {v:'BLOQ',l:'Bloqué',                   emoji:'🚫', color:'#DC2626'},
  {v:'TEST',l:'Tests en cours',           emoji:'🧪', color:'#06B6D4'},
  {v:'CORR',l:'Correction en cours',      emoji:'🔧', color:'#F59E0B'},
  {v:'TERM',l:'Terminé',                  emoji:'✔️', color:'#15803D'},
  {v:'LIV', l:'Livré',                    emoji:'📦', color:'#0D9488'},
  {v:'ARCH',l:'Archivé',                  emoji:'🗂️', color:'#9CA3AF'},
];

function SymbolsPanel({state,update}) {
  const PLACEMENTS=[
    {v:'all',l:'Toutes les pages'},
    {v:'first',l:'Couverture uniquement'},
    {v:'last',l:'Dernière page uniquement'},
    {v:'content',l:'Pages contenu uniquement'},
    {v:'specific',l:'Page spécifique'},
  ];
  return <>
    <Sect title="Symbole d'avertissement">
      <RowItem label="Activer le symbole" sub="Triangle rouge avec point d'exclamation">
        <Toggle checked={state.symEnabled} onChange={v=>update({symEnabled:v})}/>
      </RowItem>
      {state.symEnabled&&<>
        <Fld label="Texte sous le symbole">
          <input value={state.symText||''} onChange={e=>update({symText:e.target.value})} placeholder="ex : CONFIDENTIEL" style={{...inputSt}}/>
        </Fld>
        <Fld label="Aperçu">
          <div style={{display:'flex',justifyContent:'center',padding:'12px 0'}}>
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
              <svg viewBox="0 0 100 90" width={42} height={38} style={{display:'block',overflow:'visible',filter:'drop-shadow(0 2px 4px rgba(0,0,0,.2))'}}>
                <polygon points="50,4 96,86 4,86" fill="#DC2626" stroke="#fff" strokeWidth="3" strokeLinejoin="round"/>
                <text x="50" y="74" textAnchor="middle" fontWeight="900" fontSize="54" fill="#fff" fontFamily="Arial,Helvetica,sans-serif">!</text>
              </svg>
              {state.symText&&<span style={{fontSize:13,fontWeight:700,color:'#DC2626',textAlign:'center'}}>{state.symText}</span>}
            </div>
          </div>
        </Fld>
        <Fld label="Appliquer sur">
          <div style={{display:'flex',flexDirection:'column',gap:4}}>
            {PLACEMENTS.map(pl=>(
              <label key={pl.v} style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:12,color:T.ink}}>
                <input type="radio" name="symPlacement" value={pl.v} checked={(state.symPlacement||'all')===pl.v} onChange={()=>update({symPlacement:pl.v})} style={{accentColor:T.navy}}/>
                {pl.l}
              </label>
            ))}
          </div>
        </Fld>
        {(state.symPlacement||'all')==='specific'&&(
          <Fld label={`Numéro de page · ${state.symPageNum??1}`}>
            <input type="number" min="1" value={state.symPageNum??1} onChange={e=>update({symPageNum:Math.max(1,parseInt(e.target.value)||1)})} style={{...inputSt,width:'80px'}}/>
          </Fld>
        )}
        <Fld label={`Taille · ${state.symScale??20}%`}>
          <input type="range" min="4" max="50" value={state.symScale??20} onChange={e=>update({symScale:parseInt(e.target.value)})} style={{width:'100%',accentColor:'#DC2626'}}/>
        </Fld>
        <Fld label={`Position horizontale · ${state.symX??50}%`}>
          <input type="range" min="0" max="100" value={state.symX??50} onChange={e=>update({symX:parseInt(e.target.value)})} style={{width:'100%',accentColor:'#DC2626'}}/>
        </Fld>
        <Fld label={`Position verticale · ${state.symY??50}%`}>
          <input type="range" min="0" max="100" value={state.symY??50} onChange={e=>update({symY:parseInt(e.target.value)})} style={{width:'100%',accentColor:'#DC2626'}}/>
        </Fld>
      </>}
    </Sect>
    <Sect title="Avancement projet">
      <RowItem label="Activer le badge" sub="Statut coloré avec icône et libellé">
        <Toggle checked={state.advEnabled} onChange={v=>update({advEnabled:v})}/>
      </RowItem>
      {state.advEnabled&&<>
        <Fld label="Statut">
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:4}}>
            {ADV_STATUSES.map(s=>{
              const active=(state.advStatus||'AF')===s.v;
              return <button key={s.v} onClick={()=>update({advStatus:s.v})} style={{display:'flex',alignItems:'center',gap:5,padding:'5px 8px',borderRadius:6,border:`1.5px solid ${active?s.color:T.line}`,background:active?s.color+'18':T.surface,cursor:'pointer',fontFamily:'inherit',transition:'border-color .15s'}}>
                <span style={{fontSize:13}}>{s.emoji}</span>
                <div style={{display:'flex',flexDirection:'column',alignItems:'flex-start',minWidth:0}}>
                  <span style={{fontSize:12,fontWeight:700,color:active?s.color:T.ink,letterSpacing:'.04em'}}>{s.v}</span>
                  <span style={{fontSize:10,color:active?s.color:T.ink3,lineHeight:1.2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:70}}>{s.l}</span>
                </div>
              </button>;
            })}
          </div>
        </Fld>
        <Fld label="Aperçu">
          {(()=>{const s=ADV_STATUSES.find(x=>x.v===(state.advStatus||'AF'))||ADV_STATUSES[0];return(
            <div style={{display:'flex',justifyContent:'center',padding:'8px 0'}}>
              <div style={{background:s.color+'28',border:`2px solid ${s.color}`,borderRadius:8,padding:'8px 16px',display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:20}}>{s.emoji}</span>
                <div>
                  <div style={{fontSize:13,fontWeight:900,color:s.color,letterSpacing:'.06em'}}>{s.v}</div>
                  <div style={{fontSize:11,fontWeight:600,color:s.color}}>{s.l}</div>
                </div>
              </div>
            </div>
          );})()}
        </Fld>
        <Fld label="Appliquer sur">
          <div style={{display:'flex',flexDirection:'column',gap:4}}>
            {PLACEMENTS.map(pl=>(
              <label key={pl.v} style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:12,color:T.ink}}>
                <input type="radio" name="advPlacement" value={pl.v} checked={(state.advPlacement||'all')===pl.v} onChange={()=>update({advPlacement:pl.v})} style={{accentColor:T.navy}}/>
                {pl.l}
              </label>
            ))}
          </div>
        </Fld>
        {(state.advPlacement||'all')==='specific'&&(
          <Fld label={`Numéro de page · ${state.advPageNum??1}`}>
            <input type="number" min="1" value={state.advPageNum??1} onChange={e=>update({advPageNum:Math.max(1,parseInt(e.target.value)||1)})} style={{...inputSt,width:'80px'}}/>
          </Fld>
        )}
        <Fld label={`Taille · ${state.advScale??15}%`}>
          <input type="range" min="4" max="40" value={state.advScale??15} onChange={e=>update({advScale:parseInt(e.target.value)})} style={{width:'100%',accentColor:T.navy}}/>
        </Fld>
        <Fld label={`Position horizontale · ${state.advX??85}%`}>
          <input type="range" min="0" max="100" value={state.advX??85} onChange={e=>update({advX:parseInt(e.target.value)})} style={{width:'100%',accentColor:T.navy}}/>
        </Fld>
        <Fld label={`Position verticale · ${state.advY??8}%`}>
          <input type="range" min="0" max="100" value={state.advY??8} onChange={e=>update({advY:parseInt(e.target.value)})} style={{width:'100%',accentColor:T.navy}}/>
        </Fld>
      </>}
    </Sect>
    <Sect title="Mention légale">
      <RowItem label="Activer la mention" sub="Texte de confidentialité discret en bas de page">
        <Toggle checked={state.disclaimerEnabled} onChange={v=>update({disclaimerEnabled:v})}/>
      </RowItem>
      {state.disclaimerEnabled&&<>
        <Fld label="Langue">
          <div style={{display:'flex',gap:4}}>
            {[{v:'fr',l:'Français'},{v:'en',l:'English'},{v:'both',l:'FR + EN'}].map(o=>(
              <button key={o.v} onClick={()=>update({disclaimerLang:o.v})} style={{...btnSt((state.disclaimerLang||'fr')===o.v?'primary':'default',true),flex:1,justifyContent:'center'}}>{o.l}</button>
            ))}
          </div>
        </Fld>
        <Fld label="Aperçu">
          <div style={{padding:'8px 10px',background:T.panel,borderRadius:6,border:`1px solid ${T.lineSoft}`}}>
            {(state.disclaimerLang||'fr')!=='en'&&<p style={{margin:'0 0 4px',fontSize:9,color:'rgba(0,0,0,0.4)',fontStyle:'italic',lineHeight:1.5}}>Tous les dessins techniques et documents associés sont la propriété exclusive de ABRANE France S.A.S. Toute reproduction ou utilisation sans autorisation est interdite.</p>}
            {(state.disclaimerLang||'fr')!=='fr'&&<p style={{margin:0,fontSize:9,color:'rgba(0,0,0,0.4)',fontStyle:'italic',lineHeight:1.5}}>All technical drawings and associated documents are the exclusive property of ABRANE France S.A.S. Any reproduction or use without authorization is prohibited.</p>}
          </div>
        </Fld>
        <Fld label="Appliquer sur">
          <div style={{display:'flex',flexDirection:'column',gap:4}}>
            {PLACEMENTS.map(pl=>(
              <label key={pl.v} style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:12,color:T.ink}}>
                <input type="radio" name="disclaimerPlacement" value={pl.v} checked={(state.disclaimerPlacement||'all')===pl.v} onChange={()=>update({disclaimerPlacement:pl.v})} style={{accentColor:T.navy}}/>
                {pl.l}
              </label>
            ))}
          </div>
        </Fld>
        {(state.disclaimerPlacement||'all')==='specific'&&(
          <Fld label={`Numéro de page · ${state.disclaimerPageNum??1}`}>
            <input type="number" min="1" value={state.disclaimerPageNum??1} onChange={e=>update({disclaimerPageNum:Math.max(1,parseInt(e.target.value)||1)})} style={{...inputSt,width:'80px'}}/>
          </Fld>
        )}
        <Fld label={`Taille · ${state.disclaimerSize??6}pt`}>
          <input type="range" min="4" max="14" value={state.disclaimerSize??6} onChange={e=>update({disclaimerSize:parseInt(e.target.value)})} style={{width:'100%',accentColor:T.navy}}/>
        </Fld>
        <Fld label={`Position horizontale · ${state.disclaimerX??50}%`}>
          <input type="range" min="0" max="100" value={state.disclaimerX??50} onChange={e=>update({disclaimerX:parseInt(e.target.value)})} style={{width:'100%',accentColor:T.navy}}/>
        </Fld>
        <Fld label={`Position verticale · ${state.disclaimerY??95}%`}>
          <input type="range" min="0" max="100" value={state.disclaimerY??95} onChange={e=>update({disclaimerY:parseInt(e.target.value)})} style={{width:'100%',accentColor:T.navy}}/>
        </Fld>
      </>}
    </Sect>
  </>;
}

function StepPanel({step,state,update,updateNested,user,onNavigate}) {
  switch(step){
    case 'project': return <ProjectPanel  state={state} update={update}/>;
    case 'palette': return <PalettePanel  state={state} update={update} updateNested={updateNested}/>;
    case 'format':  return <FormatPanel   state={state} update={update}/>;
    case 'cover':   return <CoverPanel    state={state} update={update}/>;
    case 'index':   return <IndexPanel    state={state} update={update}/>;
    case 'mat':     return <MaterialsPanel state={state} update={update}/>;
    case 'notes':   return <NotesPanel    state={state} update={update}/>;
    case 'content': return <ContentPanel  state={state} update={update} onNavigate={onNavigate}/>;
    case 'back':    return <BackPanel     state={state} update={update}/>;
    case 'sign':    return <SignPanel     state={state} update={update} user={user}/>;
    case 'sym':     return <SymbolsPanel  state={state} update={update}/>;
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

function Inspector({step,state,update,updateNested,user,onNavigate}) {
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
      <StepPanel step={step} state={state} update={update} updateNested={updateNested} user={user} onNavigate={onNavigate}/>
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
          const hasNotes=page.type==='content'&&!!(state.pageNotes?.[page.key]);
          const borderCol=isActive?T.gold:hasNotes?'#E53E3E':'rgba(255,255,255,.18)';
          return (
            <div key={page.key} onClick={()=>onPageClick(i)} style={{
              flexShrink:0,display:'flex',flexDirection:'column',
              alignItems:'center',gap:4,cursor:'pointer'
            }}>
              <div style={{
                width:thumbW,height:thumbH,overflow:'hidden',
                borderRadius:2,position:'relative',
                border:`1.5px solid ${borderCol}`,
                boxShadow:isActive?`0 0 0 2px rgba(184,149,86,.35)`:hasNotes?'0 0 0 2px rgba(229,62,62,.25)':'none',
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
  const [quotaPrompt,setQuotaPrompt]=useState(null); // {x1,y1,x2,y2}
  const [quotaVal,setQuotaVal]=useState('');
  const [canUndo,setCanUndo]=useState(false);
  const [canRedo,setCanRedo]=useState(false);

  const setTool=t=>{toolRef.current=t;setToolState(t);};

  const applyToSel=props=>{
    const canvas=fc.current;if(!canvas)return false;
    const objs=canvas.getActiveObjects();if(!objs.length)return false;
    objs.forEach(o=>{
      if(o.type==='i-text'||o.type==='text'){
        if(props.color!=null)o.set({fill:props.color});
      }else if(o.type==='group'){
        (o._objects||[]).forEach(ch=>{
          if(props.color!=null&&ch.type==='rect')ch.set({stroke:props.color});
          if(props.color!=null&&(ch.type==='i-text'||ch.type==='text'))ch.set({fill:props.color});
          if(props.sw!=null&&ch.type==='rect')ch.set({strokeWidth:props.sw});
        });
      }else{
        if(props.color!=null)o.set({stroke:props.color});
        if(props.sw!=null)o.set({strokeWidth:props.sw});
      }
    });
    canvas.requestRenderAll();
    return true;
  };

  const setColor=c=>{
    colorRef.current=c;setColorState(c);
    if(applyToSel({color:c}))pushHist(fc.current);
  };
  const setStrokeW=w=>{
    strokeWRef.current=w;setStrokeWState(w);
    applyToSel({sw:w});
  };
  const commitStrokeW=()=>{
    if(fc.current?.getActiveObjects().length)pushHist(fc.current);
  };

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
    else{window.fabric.util.enlivenObjects(objs,en=>{en.forEach(o=>{o.selectable=true;o.evented=true;canvas.add(o);});canvas.requestRenderAll();isLoadingRef.current=false;});}
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
          en.forEach(o=>{o.selectable=true;o.evented=true;canvas.add(o);});
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

    const syncSel=opt=>{
      const o=(opt.selected||[])[0]||canvas.getActiveObject();
      if(!o)return;
      let c=null,sw=null;
      if(o.type==='i-text'||o.type==='text'){c=o.fill;}
      else if(o.type==='group'){
        const l=(o._objects||[]).find(ch=>ch.type==='line');
        const r=(o._objects||[]).find(ch=>ch.type==='rect');
        if(l?.stroke&&l.stroke!=='transparent'){c=l.stroke;sw=l.strokeWidth;}
        else{c=r?.stroke;sw=r?.strokeWidth;}
      }
      else{c=o.stroke;sw=o.strokeWidth;}
      if(c&&c!=='transparent'){colorRef.current=c;setColorState(c);}
      if(sw>0){strokeWRef.current=sw;setStrokeWState(sw);}
    };
    canvas.on('selection:created',syncSel);
    canvas.on('selection:updated',syncSel);

    // Mouse handlers (read tool/color/stroke via refs to avoid stale closures)
    canvas.on('mouse:down',opt=>{
      const t=toolRef.current;
      if(t==='select'||t==='pencil'||t==='text')return;
      if(opt.target)return; // clicked on existing object — don't start drawing
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
      } else if(t==='quota'){
        shapeRef.current=new window.fabric.Line([p.x,p.y,p.x,p.y],{stroke:col,strokeWidth:strokeWRef.current*2,strokeLineCap:'round',strokeDashArray:[6,4],selectable:false,evented:false,opacity:0.6});
        canvas.add(shapeRef.current);
      }
      canvas.requestRenderAll();
    });

    canvas.on('mouse:move',opt=>{
      if(!isDrawingRef.current||!shapeRef.current)return;
      const p=canvas.getPointer(opt.e),o=originRef.current,t=toolRef.current;
      if(t==='line'||t==='quota') shapeRef.current.set({x2:p.x,y2:p.y});
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
        if(opt.target)return; // clicked on existing object
        const p=canvas.getPointer(opt.e);
        const txt=new window.fabric.IText('Texte',{left:p.x,top:p.y,fontSize:18,fill:colorRef.current,fontFamily:'Arial'});
        canvas.add(txt);canvas.setActiveObject(txt);txt.enterEditing();txt.selectAll();
        return;
      }
      if(!isDrawingRef.current||!shapeRef.current)return;
      isDrawingRef.current=false;
      const shape=shapeRef.current;shapeRef.current=null;
      if(t==='quota'){
        const {x1,y1,x2,y2}={x1:shape.x1,y1:shape.y1,x2:shape.x2,y2:shape.y2};
        canvas.remove(shape);
        if(Math.abs(x2-x1)+Math.abs(y2-y1)>=10){setQuotaPrompt({x1,y1,x2,y2});setQuotaVal('');}
        canvas.requestRenderAll();
        return;
      }
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
    canvas.skipTargetFind=!isSel;
    canvas.defaultCursor=isSel?'default':'crosshair';
    canvas.hoverCursor=isSel?'move':'crosshair';
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

  const commitQuota=()=>{
    if(!quotaPrompt)return;
    const {x1,y1,x2,y2}=quotaPrompt;
    const text=quotaVal.trim()||'?';
    const canvas=fc.current;
    const col=colorRef.current,sw=strokeWRef.current;
    const dx=x2-x1,dy=y2-y1;
    const len=Math.sqrt(dx*dx+dy*dy);
    if(len<10){setQuotaPrompt(null);return;}
    const angle=Math.atan2(dy,dx);
    const angleDeg=angle*180/Math.PI;
    const mx=(x1+x2)/2,my=(y1+y2)/2;
    const arrowSize=Math.max(10,sw*4);
    const lineObj=new window.fabric.Line([x1,y1,x2,y2],{
      stroke:col,strokeWidth:sw,strokeLineCap:'round',
      selectable:false,evented:false,
    });
    const makeArrow=(tx,ty,dir)=>{
      const c=Math.cos(dir),s=Math.sin(dir);
      const pc=Math.cos(dir+Math.PI/2),ps=Math.sin(dir+Math.PI/2);
      const hw=arrowSize*0.38;
      const bx=tx-arrowSize*c,by=ty-arrowSize*s;
      const path=`M ${tx.toFixed(1)} ${ty.toFixed(1)} L ${(bx+hw*pc).toFixed(1)} ${(by+hw*ps).toFixed(1)} L ${(bx-hw*pc).toFixed(1)} ${(by-hw*ps).toFixed(1)} Z`;
      return new window.fabric.Path(path,{fill:col,stroke:'none',selectable:false,evented:false});
    };
    const leftArrow=makeArrow(x1,y1,angle+Math.PI);
    const rightArrow=makeArrow(x2,y2,angle);
    const fontSize=Math.max(10,sw*4+8);
    const textObj=new window.fabric.Text(text,{
      left:mx,top:my,angle:angleDeg,fontSize,
      fill:col,fontFamily:'Arial',fontWeight:'bold',
      originX:'center',originY:'center',
      selectable:false,evented:false,
    });
    // Offset text above the line (perpendicular direction)
    const textW=textObj.width||fontSize*text.length*0.6;
    const textH=textObj.height||fontSize*1.4;
    const perpUpX=Math.sin(angle);
    const perpUpY=-Math.cos(angle);
    const textLift=textH/2+10;
    textObj.set({left:mx+perpUpX*textLift,top:my+perpUpY*textLift});
    const bgRect=new window.fabric.Rect({
      left:mx+perpUpX*textLift,top:my+perpUpY*textLift,
      width:textW+20,height:textH+10,
      fill:'white',stroke:'none',strokeWidth:0,
      angle:angleDeg,originX:'center',originY:'center',
      selectable:false,evented:false,
    });
    const grp=new window.fabric.Group([lineObj,leftArrow,rightArrow,bgRect,textObj],{selectable:true,evented:true});
    canvas.add(grp);
    canvas.setActiveObject(grp);
    canvas.requestRenderAll();
    pushHist(canvas);
    setQuotaPrompt(null);
    setQuotaVal('');
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
    {id:'quota',    label:'Cote (↔)',    sym:'↔'},
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
            <input type="range" min="1" max="8" value={strokeW} onChange={e=>setStrokeW(parseInt(e.target.value))} onMouseUp={commitStrokeW} style={{width:'100%',accentColor:T.gold}}/>
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
            {quotaPrompt&&(
              <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.5)',display:'grid',placeItems:'center',zIndex:20}}>
                <div style={{background:'#fff',borderRadius:10,padding:20,minWidth:280,boxShadow:'0 12px 40px rgba(0,0,0,.5)'}}>
                  <div style={{fontSize:13,fontWeight:600,color:T.ink,marginBottom:4}}>Valeur de la cote</div>
                  <div style={{fontSize:11,color:'#888',marginBottom:10}}>Ex : 2400, 1.5m, REF A…</div>
                  <input autoFocus value={quotaVal} onChange={e=>setQuotaVal(e.target.value)}
                    onKeyDown={e=>{if(e.key==='Enter')commitQuota();if(e.key==='Escape')setQuotaPrompt(null);}}
                    style={{...inputSt,marginBottom:12}} placeholder="Saisissez la valeur…"/>
                  <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
                    <button onClick={()=>setQuotaPrompt(null)} style={btnSt('ghost',true)}>Annuler</button>
                    <button onClick={commitQuota} style={btnSt('primary',true)}>Placer</button>
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

function Configurator({user,project,onProjectSaved,onSaveStateChange}) {
  const [state,setState]=useState(()=>{
    const s=initialState(project);
    // Inject user signature from profile (never from saved project data)
    return {...s, sigUrl: user?.sigUrl||s.sigUrl||''};
  });
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
  const [projectId,setProjectId]=useState(project?.id||null);
  const [saving,setSaving]=useState(false);
  const [lastSaved,setLastSaved]=useState(project?.id?'cloud':null);

  const update=useCallback(patch=>{setState(s=>({...s,...patch,_dirty:true}));setDirtySteps(d=>({...d,[activeStepRef.current]:true}));},[]);
  const updateNested=useCallback((key,patch)=>{setState(s=>({...s,[key]:{...s[key],...patch},_dirty:true}));setDirtySteps(d=>({...d,[activeStepRef.current]:true}));},[]);
  const updatePageNotes=useCallback((pageKey,html)=>{setState(s=>({...s,pageNotes:{...(s.pageNotes||{}),[pageKey]:html},_dirty:true}));setDirtySteps(d=>({...d,content:true}));},[]);
  const showToast=m=>{setToast(m);setTimeout(()=>setToast(null),2800);};

  const save=useCallback(async()=>{
    if(!USE_CLOUD){setState(s=>({...s,_dirty:false}));showToast('Projet enregistré (local)');return;}
    setSaving(true);
    try{
      const id=await upsertProject(user.id,projectId,state.name,state);
      setProjectId(id);
      setLastSaved('cloud');
      setState(s=>({...s,_dirty:false}));
      showToast('Projet sauvegardé');
      if(onProjectSaved) onProjectSaved(id);
    }catch(e){showToast('Erreur : '+e.message);}
    finally{setSaving(false);}
  },[user,projectId,state,onProjectSaved]);

  const [savingTpl,setSavingTpl]=useState(false);
  const [tplModal,setTplModal]=useState(false);
  const [tplName,setTplName]=useState('');
  const [tplConflict,setTplConflict]=useState(null); // {id, name}
  const [showPdfModal,setShowPdfModal]=useState(false);

  const saveAsTemplate=useCallback(async(name, overwriteId=null)=>{
    if(!USE_CLOUD){showToast('Cloud requis pour sauvegarder un modèle');return;}
    setSavingTpl(true);
    try{
      if(!overwriteId){
        const existing=await findTemplateByName(name);
        if(existing){
          setTplConflict({id:existing.id,name});
          return;
        }
      }
      await upsertTemplate(user.id,overwriteId||null,name||state.client||state.name,state);
      showToast('Modèle sauvegardé');
      setTplModal(false);
      setTplConflict(null);
    }catch(e){showToast('Erreur modèle : '+e.message);}
    finally{setSavingTpl(false);}
  },[user,state]);

  const exportJson=useCallback(()=>{
    const {sigUrl:_s,_dirty:_d,...data}=state;
    const blob=new Blob([JSON.stringify({version:1,name:state.name,data},null,2)],{type:'application/json'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download=(state.name||'projet').replace(/[^a-z0-9]/gi,'_')+'.abrane.json';
    a.click();URL.revokeObjectURL(a.href);
  },[state]);

  useEffect(()=>{
    const isAdmin=user?.role==='admin'||user?.role==='superadmin';
    if(onSaveStateChange) onSaveStateChange({
      dirty:state._dirty||false,saving,lastSaved,
      onSave:save,
      onSaveAsTemplate:isAdmin?()=>{ setTplName(state.client||state.name||''); setTplModal(true); }:null,
      onExportJson:exportJson,
      onExportPdf:()=>setShowPdfModal(true),
    });
  },[state._dirty,saving,lastSaved,save,exportJson,user,onSaveStateChange]);

  const compl=computeCompletion(state,dirtySteps);
  const PALETTE_H={S:99,M:122,L:150};
  const paletteH=paletteCollapsed?32:PALETTE_H[thumbSize];
  return <div style={{display:'flex',flex:1,overflow:'hidden',minHeight:0}}>
    <Rail steps={STEPS} active={activeStep} state={state} compl={compl} onPick={id=>{activeStepRef.current=id;setActiveStep(id);}}/>
    {activeStep&&<Inspector step={activeStep} state={state} update={update} updateNested={updateNested} user={user} onNavigate={setActivePage}/>}
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
    {tplModal&&<Scrim onClose={()=>setTplModal(false)}>
      <div onClick={e=>e.stopPropagation()} style={{background:T.surface,borderRadius:12,padding:28,width:360,boxShadow:'0 24px 60px rgba(0,0,0,.18)'}}>
        <div style={{fontSize:15,fontWeight:700,color:T.ink,marginBottom:6}}>Sauvegarder comme modèle</div>
        <div style={{fontSize:12,color:T.ink3,marginBottom:16}}>Ce modèle sera visible par tous les utilisateurs pour créer un nouveau projet.</div>
        <input autoFocus value={tplName} onChange={e=>setTplName(e.target.value)}
          placeholder="Nom du modèle (ex: SANDRO Paris)" style={{...inputSt,marginBottom:16}}/>
        <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
          <button onClick={()=>setTplModal(false)} style={btnSt()}>Annuler</button>
          <button onClick={()=>saveAsTemplate(tplName)} disabled={!tplName.trim()||savingTpl}
            style={{...btnSt('primary'),opacity:(!tplName.trim()||savingTpl)?.7:1}}>
            <Icon name={savingTpl?'history':'bookmark'} size={13} color="#fff"/>
            {savingTpl?'Sauvegarde…':'Sauvegarder'}
          </button>
        </div>
      </div>
    </Scrim>}
    {showPdfModal&&<PdfExportModal state={state} onClose={()=>setShowPdfModal(false)}/>}
    {tplConflict&&<Scrim onClose={()=>{setTplConflict(null);setSavingTpl(false);}}>
      <div onClick={e=>e.stopPropagation()} style={{background:T.surface,borderRadius:12,padding:28,width:360,boxShadow:'0 24px 60px rgba(0,0,0,.18)'}}>
        <div style={{fontSize:15,fontWeight:700,color:T.ink,marginBottom:8}}>Modèle existant</div>
        <div style={{fontSize:13,color:T.ink3,marginBottom:20}}>Un modèle nommé <strong style={{color:T.ink}}>«&nbsp;{tplConflict.name}&nbsp;»</strong> existe déjà. Voulez-vous le remplacer ?</div>
        <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
          <button onClick={()=>{setTplConflict(null);setSavingTpl(false);}} style={btnSt()}>Annuler</button>
          <button onClick={()=>saveAsTemplate(tplConflict.name,tplConflict.id)} disabled={savingTpl}
            style={{...btnSt('primary'),background:'#C53030',borderColor:'#C53030',opacity:savingTpl?.7:1}}>
            <Icon name="save" size={13} color="#fff"/>
            {savingTpl?'Sauvegarde…':'Remplacer'}
          </button>
        </div>
      </div>
    </Scrim>}
    {showVueEnsemble&&<VueEnsembleModal state={state} update={update} onClose={()=>setShowVueEnsemble(false)}/>}
    {annotating&&<AnnotatorModal state={state} update={update}
      pageKey={annotating.pageKey} pageUrl={annotating.pageUrl}
      isPortrait={annotating.isPortrait} onClose={()=>setAnnotating(null)}/>}
  </div>;
}

function TopBar({user,screen,project,onHome,onLogout,onOpenAdmin,onSave,onSaveAsTemplate,onExportJson,onExportPdf,saving,dirty,lastSaved}) {
  const [menuOpen,setMenuOpen]=useState(false);
  return <header style={{display:'flex',alignItems:'center',gap:14,padding:'0 14px 0 12px',background:T.surface,borderBottom:`1px solid ${T.line}`,height:56,flexShrink:0,position:'relative',zIndex:50}}>
    <button onClick={onHome} style={{display:'flex',alignItems:'center',gap:10,background:'transparent',border:'none',padding:0,cursor:'pointer'}}>
      <AbraneLogoBox size="md"/>
      <span style={{fontSize:11.5,color:T.ink3,borderLeft:`1px solid ${T.line}`,paddingLeft:10}}>Catalogue</span>
    </button>
    {screen!=='dashboard'&&<>
      <div style={{width:1,height:22,background:T.line}}/>
      <button style={{...btnSt('ghost',true),border:'none'}} onClick={onHome}><Icon name="back" size={14} color={T.ink2}/>Mes projets</button>
      <div style={{width:1,height:22,background:T.line}}/>
      <div style={{display:'inline-flex',alignItems:'center',gap:8,fontSize:13,fontWeight:600,color:T.ink}}><Icon name="doc" size={14} color={T.ink3}/>{project?.name||'Nouveau projet'}</div>
      {lastSaved==='cloud'&&!dirty&&<span style={{fontSize:10.5,color:T.success,padding:'2px 8px',border:`1px solid ${T.successT}`,borderRadius:999,fontWeight:500,display:'inline-flex',alignItems:'center',gap:4}}><Icon name="cloud" size={11} color={T.success}/>Sauvegardé</span>}
      {dirty&&<span style={{fontSize:10.5,color:T.ink4,padding:'2px 8px',border:`1px solid ${T.lineSoft}`,borderRadius:999}}>Modifications non sauvegardées</span>}
    </>}
    <div style={{flex:1}}/>
    {onOpenAdmin&&<button onClick={onOpenAdmin} style={{...btnSt('gold',true)}}><Icon name="shield" size={13} color={T.navy}/>Admin</button>}
    {screen==='configurator'&&<>
      {onSaveAsTemplate&&<button onClick={onSaveAsTemplate} style={btnSt('gold',true)}><Icon name="bookmark" size={13} color={T.navy}/>Sauver modèle</button>}
      <button onClick={onSave} disabled={saving||!dirty} style={{...btnSt(dirty?'primary':'default',true),opacity:(saving||!dirty)?.6:1}}>
        <Icon name={saving?'history':'save'} size={13} color={dirty?'#fff':T.ink3}/>
        {saving?'Sauvegarde…':'Sauver projet'}
      </button>
      {onExportPdf&&<button onClick={onExportPdf} style={btnSt(undefined,true)}><Icon name="pdf" size={13} color={T.ink}/>PDF</button>}
      <button onClick={onExportJson} style={btnSt(undefined,true)}><Icon name="download" size={14} color={T.ink}/>JSON</button>
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
  const [project,setProject]=useState(null);
  const [showAdmin,setShowAdmin]=useState(false);
  const [saveBarProps,setSaveBarProps]=useState({dirty:false,saving:false,lastSaved:null,onSave:()=>{}});
  const [brand,setBrand]=useState(()=>({
    officialLogo:localStorage.getItem('abrane_logo')||'',
    wmLogo:localStorage.getItem('abrane_wm')||'',
    shopLogos:JSON.parse(localStorage.getItem('abrane_shop_logos')||'{}'),
    stampLogo:localStorage.getItem('abrane_stamp')||'',
  }));
  const brandCtxVal=useMemo(()=>({...brand,setBrand}),[brand]);

  // Ripristina sessione Supabase esistente al caricamento
  useEffect(()=>{
    if(!USE_CLOUD) return;
    getSession().then(async sbUser=>{
      if(!sbUser) return;
      const profile=await getProfile(sbUser.id);
      setUser(toAppUser(sbUser,profile));
      setScreen('dashboard');
    });
  },[]);

  const handleLogout=async()=>{
    if(USE_CLOUD) await signOut();
    setUser(null);
    setProject(null);
    setScreen('login');
  };

  if(!user||screen==='login') return (
    <BrandCtx.Provider value={brandCtxVal}>
      <LoginScreen onLogin={u=>{setUser(u);setScreen('dashboard');}}/>
    </BrandCtx.Provider>
  );

  return (
    <BrandCtx.Provider value={brandCtxVal}>
      <div style={{display:'flex',flexDirection:'column',height:'100vh',overflow:'hidden',fontFamily:'-apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif',fontSize:13,color:T.ink,background:T.bg,WebkitFontSmoothing:'antialiased'}}>
        <TopBar user={user} screen={screen} project={project}
          onHome={()=>setScreen('dashboard')} onLogout={handleLogout}
          onOpenAdmin={user.role==='superadmin'?()=>setShowAdmin(true):null}
          onSave={saveBarProps.onSave} saving={saveBarProps.saving}
          dirty={saveBarProps.dirty} lastSaved={saveBarProps.lastSaved}
          onSaveAsTemplate={saveBarProps.onSaveAsTemplate||null}
          onExportJson={saveBarProps.onExportJson||null}
          onExportPdf={saveBarProps.onExportPdf||null}/>
        {screen==='dashboard'&&<Dashboard user={user}
          onOpenProject={p=>{setProject(p);setScreen('configurator');}}
          onNewProject={()=>{setProject(null);setScreen('configurator');}}
          onImportProject={proj=>{setProject(proj);setScreen('configurator');}}
          onOpenTemplate={tpl=>{
            if(tpl._raw?.data){
              setProject({_isTemplate:true,name:'Nouveau — '+(tpl.author||tpl.name),basedOn:tpl.name,data:tpl._raw.data});
            } else {
              setProject({name:'Nouveau — '+tpl.name,pageFormat:tpl.pageFormat,palette:tpl.palette,client:'',basedOn:tpl.name});
            }
            setScreen('configurator');
          }}/>}
        {screen==='configurator'&&<Configurator user={user} project={project}
          onSaveStateChange={setSaveBarProps}/>}
        {showAdmin&&<AdminPanel onClose={()=>setShowAdmin(false)} currentUserId={user?.id}/>}
      </div>
    </BrandCtx.Provider>
  );
}
