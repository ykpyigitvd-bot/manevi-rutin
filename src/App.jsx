import { useState, useEffect } from "react";

const SUPABASE_URL = "https://flbfwbairaaopldsakui.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsYmZ3YmFpcmFhb3BsZHNha3VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4ODQ0NzMsImV4cCI6MjA5MjQ2MDQ3M30.YDpAXV4rnBqoNqUP1ev4XPZwW2Nd_h210v-6FuZif30";

const db = async (path, options = {}) => {
  const { prefer, body, method = "GET" } = options;
  const headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    "Prefer": prefer !== undefined ? prefer : "return=representation",
  };
  const fetchOpts = { method, headers };
  if (body) fetchOpts.body = body;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, fetchOpts);
  if (!res.ok && res.status !== 409) {
    const err = await res.text();
    throw new Error(`HTTP ${res.status}: ${err}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
};

const VARSAYILAN_SABAH = [
  { id: "s1", metin: "Sabah namazı kıldım", ikon: "🌅", sabit: true },
  { id: "s2", metin: "Sabah zikirlerini okudum", ikon: "📿", sabit: true },
  { id: "s3", metin: "Ayetel Kürsi okudum", ikon: "📖", sabit: true },
  { id: "s4", metin: "Sabah duasını ettim", ikon: "🤲", sabit: true },
  { id: "s5", metin: "Estağfirullah (33x)", ikon: "✨", sabit: true },
];
const VARSAYILAN_AKSAM = [
  { id: "a1", metin: "Akşam namazı kıldım", ikon: "🌙", sabit: true },
  { id: "a2", metin: "Akşam zikirlerini okudum", ikon: "📿", sabit: true },
  { id: "a3", metin: "Ayetel Kürsi okudum", ikon: "📖", sabit: true },
  { id: "a4", metin: "Akşam duasını ettim", ikon: "🤲", sabit: true },
  { id: "a5", metin: "Yatsı namazı kıldım", ikon: "⭐", sabit: true },
];
const RAMAZAN_SABAH = [
  { id: "r1", metin: "Sahur yaptım", ikon: "🌙", sabit: false },
  { id: "r2", metin: "Teravih niyeti ettim", ikon: "🕌", sabit: false },
];
const RAMAZAN_AKSAM = [
  { id: "r3", metin: "İftar duasını ettim", ikon: "🌟", sabit: false },
  { id: "r4", metin: "Teravih namazı kıldım", ikon: "🕌", sabit: false },
  { id: "r5", metin: "Kuran okuma hedefim", ikon: "📖", sabit: false },
];
const MOTIVASYON = [
  "Her adım seni O'na yaklaştırır.",
  "Dün geçti. Bugün yeni bir başlangıç.",
  "Küçük ama devamlı amel, en sevilen ameldir.",
  "Kalbini temiz tut — her şey oradan başlar.",
  "Sabır ve şükür — ikisi de nimettir.",
  "Allahım, bugün beni doğru yolda tut.",
  "Bugün ektiğin, yarın biçeceğindir.",
];
const IKONLAR = ["🤲","📿","📖","🕌","⭐","✨","🌙","🌅","💎","🌿","🕊️","🔆","☀️","🌸"];

const bugunStr = () => new Date().toISOString().split("T")[0];
const gunAdi = (d) => ["Paz","Pzt","Sal","Çar","Per","Cum","Cmt"][new Date(d+"T12:00:00").getDay()];
const formatTarih = () => new Date().toLocaleDateString("tr-TR",{day:"numeric",month:"long",year:"numeric"});
const hicriGun = () => ["Pazar","Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi"][new Date().getDay()];
const sonYediGun = () => Array.from({length:7},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-6+i); return d.toISOString().split("T")[0]; });

export default function ManeviRutin() {
  const [ekran, setEkran] = useState("yukluyor");
  const [aktifSekme, setAktifSekme] = useState("sabah");
  const [ramazanModu, setRamazanModu] = useState(false);
  const [kullanici, setKullanici] = useState(null);
  const [sabahGorevler, setSabahGorevler] = useState(VARSAYILAN_SABAH);
  const [aksamGorevler, setAksamGorevler] = useState(VARSAYILAN_AKSAM);
  const [gunlukVeri, setGunlukVeri] = useState({});
  const [streak, setStreak] = useState(0);
  const [enUzunStreak, setEnUzunStreak] = useState(0);
  const [kutlama, setKutlama] = useState(false);
  const [yeniGorevMetin, setYeniGorevMetin] = useState("");
  const [yeniGorevIkon, setYeniGorevIkon] = useState("🤲");
  const [gorevEkleAcik, setGorevEkleAcik] = useState(false);
  const [onboardAd, setOnboardAd] = useState("");
  const [onboardYukleniyor, setOnboardYukleniyor] = useState(false);
  const [paylasimMesaj, setPaylasimMesaj] = useState("");
  const [hata, setHata] = useState("");

  useEffect(() => {
    const kid = localStorage.getItem("mk_kid");
    const ram = localStorage.getItem("mk_ramazan");
    if (ram) setRamazanModu(ram === "1");
    if (kid) kullaniciyiYukle(kid);
    else setEkran("onboarding");
  }, []);

  const kullaniciyiYukle = async (kid) => {
    try {
      const kData = await db(`kullanicilar?id=eq.${kid}&select=*`);
      if (!kData || kData.length === 0) { localStorage.removeItem("mk_kid"); setEkran("onboarding"); return; }
      setKullanici(kData[0]);
      const gData = await db(`gunluk_veri?kullanici_id=eq.${kid}&select=*&order=tarih.desc&limit=90`);
      const veriMap = {};
      if (gData) gData.forEach(g => { veriMap[g.tarih] = { tamamlanan: g.tamamlanan || {}, tamam: g.tamam }; });
      setGunlukVeri(veriMap);
      const { str, enU } = streakHesapla(veriMap);
      setStreak(str); setEnUzunStreak(enU);
      const oData = await db(`ozel_gorevler?kullanici_id=eq.${kid}&select=*&order=created_at.asc`);
      if (oData) {
        const so = oData.filter(g => g.tip === "sabah").map(g => ({ id: g.id, metin: g.metin, ikon: g.ikon, sabit: false }));
        const ao = oData.filter(g => g.tip === "aksam").map(g => ({ id: g.id, metin: g.metin, ikon: g.ikon, sabit: false }));
        if (so.length) setSabahGorevler([...VARSAYILAN_SABAH, ...so]);
        if (ao.length) setAksamGorevler([...VARSAYILAN_AKSAM, ...ao]);
      }
      setEkran("ana");
    } catch (e) { setHata("Bağlantı hatası."); setEkran("onboarding"); }
  };

  const streakHesapla = (veriMap) => {
    let str = 0, enU = 0;
    const bugun = bugunStr();
    const gunler = Object.keys(veriMap).sort().reverse();
    let beklenen = bugun;
    for (const g of gunler) {
      if (g === beklenen && veriMap[g]?.tamam) {
        str++;
        const d = new Date(beklenen + "T12:00:00"); d.setDate(d.getDate() - 1);
        beklenen = d.toISOString().split("T")[0];
      } else break;
    }
    let sira = 0;
    Object.keys(veriMap).sort().forEach(g => { if (veriMap[g]?.tamam) { sira++; if (sira > enU) enU = sira; } else sira = 0; });
    return { str, enU };
  };

  const onboardTamamla = async () => {
    if (!onboardAd.trim()) return;
    setOnboardYukleniyor(true); setHata("");
    try {
      const data = await db("kullanicilar", { method: "POST", prefer: "return=representation", body: JSON.stringify({ ad: onboardAd.trim() }) });
      let k = Array.isArray(data) ? data[0] : data;
      if (!k?.id) throw new Error("Geçersiz yanıt");
      localStorage.setItem("mk_kid", k.id);
      setKullanici(k); setEkran("ana");
    } catch (e) { setHata("Hata: " + e.message); }
    setOnboardYukleniyor(false);
  };

  const toggle = async (id) => {
    const bugun = bugunStr();
    const mevcutGun = gunlukVeri[bugun] || { tamamlanan: {}, tamam: false };
    const yeniTam = { ...mevcutGun.tamamlanan, [id]: !mevcutGun.tamamlanan[id] };
    const tumIds = [...sabahGorevler, ...aksamGorevler, ...(ramazanModu ? [...RAMAZAN_SABAH, ...RAMAZAN_AKSAM] : [])].map(d => d.id);
    const hepsi = tumIds.every(i => yeniTam[i]);
    const yeniVeri = { ...gunlukVeri, [bugun]: { tamamlanan: yeniTam, tamam: hepsi } };
    setGunlukVeri(yeniVeri);
    try {
      await db("gunluk_veri", { method: "POST", prefer: "resolution=merge-duplicates", body: JSON.stringify({ kullanici_id: kullanici.id, tarih: bugun, tamamlanan: yeniTam, tamam: hepsi }) });
    } catch (e) { console.error(e); }
    if (hepsi && !mevcutGun.tamam) {
      const { str, enU } = streakHesapla(yeniVeri);
      setStreak(str); setEnUzunStreak(enU);
      setKutlama(true); setTimeout(() => setKutlama(false), 3000);
    }
  };

  const gorevEkle = async (tip) => {
    if (!yeniGorevMetin.trim()) return;
    try {
      const data = await db("ozel_gorevler", { method: "POST", prefer: "return=representation", body: JSON.stringify({ kullanici_id: kullanici.id, tip, metin: yeniGorevMetin.trim(), ikon: yeniGorevIkon }) });
      const yeni = Array.isArray(data) ? data[0] : data;
      const gorev = { id: yeni.id, metin: yeni.metin, ikon: yeni.ikon, sabit: false };
      if (tip === "sabah") setSabahGorevler(g => [...g, gorev]);
      else setAksamGorevler(g => [...g, gorev]);
      setYeniGorevMetin(""); setGorevEkleAcik(false);
    } catch (e) { setHata("Görev eklenemedi."); }
  };

  const gorevSil = async (id, tip) => {
    try {
      await db(`ozel_gorevler?id=eq.${id}`, { method: "DELETE", prefer: "" });
      if (tip === "sabah") setSabahGorevler(g => g.filter(x => x.id !== id));
      else setAksamGorevler(g => g.filter(x => x.id !== id));
    } catch (e) { console.error(e); }
  };

  const paylasimYap = () => {
    const metin = `🔥 ${streak} günlük manevi streak!\n📿 Bugün tüm görevlerimi tamamladım.\n\n#ManeviRutin #İslam #Alhamdulillah`;
    if (navigator.share) navigator.share({ text: metin }).catch(() => {});
    else { navigator.clipboard.writeText(metin); setPaylasimMesaj("Kopyalandı! ✓"); setTimeout(() => setPaylasimMesaj(""), 2000); }
  };

  const bugun = bugunStr();
  const tamamlanan = gunlukVeri[bugun]?.tamamlanan || {};
  const aktifListe = aktifSekme === "sabah" ? [...sabahGorevler, ...(ramazanModu ? RAMAZAN_SABAH : [])] : [...aksamGorevler, ...(ramazanModu ? RAMAZAN_AKSAM : [])];
  const tumGorevler = [...sabahGorevler, ...aksamGorevler, ...(ramazanModu ? [...RAMAZAN_SABAH, ...RAMAZAN_AKSAM] : [])];
  const toplamTam = tumGorevler.filter(d => tamamlanan[d.id]).length;
  const yuzde = Math.round((toplamTam / tumGorevler.length) * 100);
  const sabahTam = [...sabahGorevler, ...(ramazanModu ? RAMAZAN_SABAH : [])].filter(d => tamamlanan[d.id]).length;
  const aksamTam = [...aksamGorevler, ...(ramazanModu ? RAMAZAN_AKSAM : [])].filter(d => tamamlanan[d.id]).length;
  const yedi = sonYediGun();
  const haftaTamamlanan = yedi.filter(d => gunlukVeri[d]?.tamam).length;
  const toplamGun = Object.keys(gunlukVeri).filter(d => gunlukVeri[d]?.tamam).length;
  const motivasyon = MOTIVASYON[new Date().getDay() % MOTIVASYON.length];

  const S = {
    sayfa: { minHeight: "100vh", background: "linear-gradient(160deg,#090e1d 0%,#0d1827 50%,#091220 100%)", fontFamily: "'Georgia','Times New Roman',serif", color: "#e8d5b0", display: "flex", flexDirection: "column", alignItems: "center", padding: "0 0 90px", position: "relative", overflow: "hidden" },
    kart: (a) => ({ background: a ? "rgba(201,169,110,0.13)" : "rgba(255,255,255,0.04)", border: a ? "1px solid rgba(201,169,110,0.35)" : "1px solid rgba(255,255,255,0.07)", borderRadius: "16px", backdropFilter: "blur(8px)" }),
    dugme: (a) => ({ flex: 1, padding: "10px 16px", border: a ? "1px solid rgba(201,169,110,0.3)" : "1px solid transparent", cursor: "pointer", borderRadius: "10px", fontSize: "14px", fontFamily: "Georgia,serif", background: a ? "rgba(201,169,110,0.2)" : "transparent", color: a ? "#c9a96e" : "#8ba0b8", transition: "all 0.2s" }),
    input: { width: "100%", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(201,169,110,0.2)", borderRadius: "10px", padding: "12px 14px", color: "#e8d5b0", fontSize: "14px", fontFamily: "Georgia,serif", outline: "none", boxSizing: "border-box" },
  };

  const CSS = `
    @keyframes twinkle{0%,100%{opacity:0.1}50%{opacity:0.5}}
    @keyframes slideIn{from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}}
    @keyframes fadeUp{from{transform:translateY(30px);opacity:0}to{transform:translateY(0);opacity:1}}
    @keyframes celebrate{0%{transform:translateX(-50%) scale(0.8);opacity:0}60%{transform:translateX(-50%) scale(1.05)}100%{transform:translateX(-50%) scale(1);opacity:1}}
    @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
    .gorev:hover{transform:translateX(4px)} .gorev{transition:transform 0.2s,background 0.2s}
  `;

  if (ekran === "yukluyor") return <div style={{...S.sayfa,justifyContent:"center",alignItems:"center"}}><style>{CSS}</style><div style={{fontSize:"48px",animation:"spin 2s linear infinite"}}>☽</div></div>;

  if (ekran === "onboarding") return (
    <div style={{...S.sayfa,justifyContent:"center",padding:"40px 24px"}}>
      <style>{CSS}</style>
      <div style={{maxWidth:"400px",width:"100%",textAlign:"center",animation:"fadeUp 0.6s ease"}}>
        <div style={{fontSize:"64px",marginBottom:"16px"}}>🌙</div>
        <div style={{fontSize:"20px",color:"#c9a96e",marginBottom:"8px",letterSpacing:"2px"}}>بِسْمِ اللَّهِ</div>
        <h1 style={{fontSize:"28px",color:"#e8d5b0",margin:"0 0 8px",fontWeight:"normal"}}>Manevi Rutin</h1>
        <p style={{color:"#8ba0b8",fontSize:"14px",marginBottom:"36px",lineHeight:"1.6"}}>Günlük ibadetlerini takip et,<br/>alışkanlık kazan, ruhunu besle.</p>
        <input style={{...S.input,marginBottom:"12px",textAlign:"center"}} placeholder="Adını yaz..." value={onboardAd} onChange={e=>setOnboardAd(e.target.value)} onKeyDown={e=>e.key==="Enter"&&onboardTamamla()}/>
        {hata && <div style={{color:"#e08080",fontSize:"12px",marginBottom:"10px"}}>{hata}</div>}
        <button onClick={onboardTamamla} disabled={onboardYukleniyor} style={{width:"100%",padding:"14px",background:"linear-gradient(135deg,#c9a96e,#a07840)",border:"none",borderRadius:"14px",color:"#0a0f1e",fontSize:"16px",fontFamily:"Georgia,serif",fontWeight:"bold",cursor:"pointer",opacity:onboardYukleniyor?0.7:1}}>
          {onboardYukleniyor?"Oluşturuluyor...":"Başla →"}
        </button>
      </div>
    </div>
  );

  if (ekran === "istatistik") return (
    <div style={S.sayfa}>
      <style>{CSS}</style><Yildizlar/>
      <div style={{width:"100%",maxWidth:"440px",padding:"40px 20px 0",position:"relative",zIndex:1}}>
        <GeriBaslik baslik="İstatistikler" setEkran={setEkran}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"10px",marginBottom:"16px"}}>
          {[{label:"Mevcut Streak",val:`${streak}🔥`},{label:"En Uzun",val:`${enUzunStreak}⚡`},{label:"Toplam Gün",val:`${toplamGun}`}].map((s,i)=>(
            <div key={i} style={{...S.kart(false),padding:"16px 12px",textAlign:"center"}}>
              <div style={{fontSize:"22px",color:"#c9a96e",marginBottom:"4px"}}>{s.val}</div>
              <div style={{fontSize:"10px",color:"#8ba0b8"}}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{...S.kart(false),padding:"20px",marginBottom:"14px"}}>
          <div style={{fontSize:"13px",color:"#8ba0b8",marginBottom:"14px"}}>Son 7 Gün</div>
          <div style={{display:"flex",gap:"6px",justifyContent:"space-between"}}>
            {yedi.map(d=>{
              const tamam=gunlukVeri[d]?.tamam, bugunmu=d===bugun;
              return <div key={d} style={{textAlign:"center",flex:1}}>
                <div style={{width:"36px",height:"36px",borderRadius:"10px",background:tamam?"linear-gradient(135deg,#c9a96e,#a07840)":bugunmu?"rgba(201,169,110,0.15)":"rgba(255,255,255,0.05)",border:bugunmu&&!tamam?"1px solid rgba(201,169,110,0.3)":"none",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 4px",fontSize:"14px",color:tamam?"#0a0f1e":"#8ba0b8"}}>{tamam?"✓":"·"}</div>
                <div style={{fontSize:"10px",color:"#8ba0b8"}}>{gunAdi(d)}</div>
              </div>;
            })}
          </div>
          <div style={{marginTop:"14px",padding:"10px 14px",background:"rgba(201,169,110,0.07)",borderRadius:"10px",fontSize:"13px",color:"#c9a96e",textAlign:"center"}}>
            Bu hafta {haftaTamamlanan}/7 gün {haftaTamamlanan>=5?"🌟 Harika!":haftaTamamlanan>=3?"💪 İyi gidiyorsun":"🌱 Devam et"}
          </div>
        </div>
        <button onClick={paylasimYap} style={{width:"100%",padding:"14px",background:"rgba(201,169,110,0.1)",border:"1px solid rgba(201,169,110,0.25)",borderRadius:"14px",color:"#c9a96e",fontSize:"14px",fontFamily:"Georgia,serif",cursor:"pointer"}}>
          {paylasimMesaj||"📤 Streakını Paylaş"}
        </button>
      </div>
      <NavBar ekran={ekran} setEkran={setEkran}/>
    </div>
  );

  if (ekran === "takvim") return (
    <div style={S.sayfa}>
      <style>{CSS}</style><Yildizlar/>
      <div style={{width:"100%",maxWidth:"440px",padding:"40px 20px 0",position:"relative",zIndex:1}}>
        <GeriBaslik baslik="Takvim" setEkran={setEkran}/>
        <TakvimGrid gunlukVeri={gunlukVeri} bugun={bugun}/>
      </div>
      <NavBar ekran={ekran} setEkran={setEkran}/>
    </div>
  );

  if (ekran === "ayarlar") return (
    <div style={S.sayfa}>
      <style>{CSS}</style><Yildizlar/>
      <div style={{width:"100%",maxWidth:"440px",padding:"40px 20px 0",position:"relative",zIndex:1}}>
        <GeriBaslik baslik="Ayarlar" setEkran={setEkran}/>
        <div style={{...S.kart(false),padding:"18px 20px",marginBottom:"12px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:"15px",color:"#e8d5b0",marginBottom:"2px"}}>🌙 Ramazan Modu</div>
            <div style={{fontSize:"12px",color:"#8ba0b8"}}>Sahur, iftar ve teravih görevleri</div>
          </div>
          <Toggle aktif={ramazanModu} onChange={v=>{setRamazanModu(v);localStorage.setItem("mk_ramazan",v?"1":"0");}}/>
        </div>
        <div style={{...S.kart(false),padding:"18px 20px",marginBottom:"12px"}}>
          <div style={{fontSize:"13px",color:"#8ba0b8",marginBottom:"4px"}}>Kullanıcı</div>
          <div style={{fontSize:"16px",color:"#e8d5b0"}}>{kullanici?.ad}</div>
        </div>
        <div style={{...S.kart(false),padding:"14px 20px",marginBottom:"20px",fontSize:"13px",color:"#8ba0b8",lineHeight:"1.6"}}>
          ☁️ Veriler buluta kaydediliyor. Telefon değiştirsen de streakın kaybolmaz.
        </div>
        <button onClick={()=>{if(confirm("Oturumu kapat?")){localStorage.removeItem("mk_kid");window.location.reload();}}} style={{width:"100%",padding:"14px",background:"rgba(200,60,60,0.1)",border:"1px solid rgba(200,60,60,0.2)",borderRadius:"14px",color:"#e08080",fontSize:"14px",fontFamily:"Georgia,serif",cursor:"pointer"}}>
          Oturumu Kapat
        </button>
      </div>
      <NavBar ekran={ekran} setEkran={setEkran}/>
    </div>
  );

  return (
    <div style={S.sayfa}>
      <style>{CSS}</style><Yildizlar/>
      {kutlama && <div style={{position:"fixed",top:"20px",left:"50%",background:"linear-gradient(135deg,#c9a96e,#a07840)",color:"#0a0f1e",padding:"14px 24px",borderRadius:"16px",fontWeight:"bold",fontSize:"14px",zIndex:100,animation:"celebrate 0.4s ease forwards",boxShadow:"0 8px 32px rgba(201,169,110,0.4)",textAlign:"center"}}>🌟 Mâşaâllah! Hepsi tamamlandı!<br/><span style={{fontSize:"12px",opacity:0.8}}>Streak: {streak} gün 🔥</span></div>}
      <div style={{width:"100%",maxWidth:"440px",padding:"36px 20px 0",position:"relative",zIndex:1}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"20px"}}>
          <div>
            <div style={{fontSize:"18px",color:"#c9a96e",marginBottom:"2px",letterSpacing:"1px"}}>بِسْمِ اللَّهِ</div>
            <div style={{fontSize:"13px",color:"#8ba0b8"}}>{hicriGun()} · {formatTarih()}</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:"13px",color:"#8ba0b8"}}>{kullanici?.ad}</div>
            <div style={{fontSize:"22px",marginTop:"2px"}}>🔥 {streak}</div>
          </div>
        </div>
        <div style={{...S.kart(false),padding:"18px 20px",marginBottom:"14px"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:"10px"}}>
            <div style={{fontSize:"14px",color:"#e8d5b0"}}>{toplamTam}/{tumGorevler.length} görev</div>
            <div style={{fontSize:"14px",color:"#c9a96e"}}>%{yuzde}</div>
          </div>
          <div style={{height:"6px",background:"rgba(255,255,255,0.07)",borderRadius:"3px",overflow:"hidden"}}>
            <div style={{height:"100%",width:`${yuzde}%`,background:"linear-gradient(90deg,#c9a96e,#e8c87a)",borderRadius:"3px",transition:"width 0.5s ease"}}/>
          </div>
        </div>
        <div style={{background:"rgba(201,169,110,0.06)",border:"1px solid rgba(201,169,110,0.12)",borderRadius:"12px",padding:"12px 16px",marginBottom:"16px",fontSize:"13px",color:"#c9a96e",fontStyle:"italic",textAlign:"center"}}>
          "{motivasyon}"
        </div>
        {ramazanModu && <div style={{background:"rgba(201,169,110,0.08)",border:"1px solid rgba(201,169,110,0.2)",borderRadius:"10px",padding:"8px 14px",marginBottom:"12px",fontSize:"13px",color:"#c9a96e",textAlign:"center"}}>🌙 Ramazan Modu Aktif</div>}
        <div style={{display:"flex",gap:"6px",marginBottom:"12px",background:"rgba(255,255,255,0.04)",borderRadius:"12px",padding:"4px"}}>
          {["sabah","aksam"].map(s=>(
            <button key={s} onClick={()=>setAktifSekme(s)} style={S.dugme(aktifSekme===s)}>
              {s==="sabah"?"🌅 Sabah":"🌙 Akşam"}
              <span style={{marginLeft:"6px",fontSize:"11px",opacity:0.7}}>{s==="sabah"?sabahTam:aksamTam}/{s==="sabah"?[...sabahGorevler,...(ramazanModu?RAMAZAN_SABAH:[])].length:[...aksamGorevler,...(ramazanModu?RAMAZAN_AKSAM:[])].length}</span>
            </button>
          ))}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:"8px",marginBottom:"10px"}}>
          {aktifListe.map((dua,i)=>{
            const tam=!!tamamlanan[dua.id];
            return <div key={dua.id} className="gorev" onClick={()=>toggle(dua.id)} style={{display:"flex",alignItems:"center",gap:"12px",padding:"14px 16px",borderRadius:"14px",cursor:"pointer",...(tam?{background:"rgba(201,169,110,0.12)",border:"1px solid rgba(201,169,110,0.3)"}:{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.06)"}),animation:`slideIn ${0.2+i*0.06}s ease both`}}>
              <div style={{width:"22px",height:"22px",borderRadius:"7px",flexShrink:0,border:tam?"2px solid #c9a96e":"2px solid rgba(255,255,255,0.15)",background:tam?"rgba(201,169,110,0.2)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s"}}>
                {tam&&<span style={{fontSize:"12px",color:"#c9a96e"}}>✓</span>}
              </div>
              <span style={{fontSize:"18px"}}>{dua.ikon}</span>
              <span style={{fontSize:"14px",flex:1,color:tam?"#c9a96e":"#d4c4a0",textDecoration:tam?"line-through":"none",transition:"all 0.2s"}}>{dua.metin}</span>
              {!dua.sabit&&<span onClick={e=>{e.stopPropagation();gorevSil(dua.id,aktifSekme);}} style={{fontSize:"18px",opacity:0.25,padding:"0 4px",cursor:"pointer"}}>×</span>}
            </div>;
          })}
        </div>
        {gorevEkleAcik?(
          <div style={{...S.kart(false),padding:"16px",marginBottom:"12px"}}>
            <div style={{fontSize:"13px",color:"#8ba0b8",marginBottom:"10px"}}>Yeni Görev — {aktifSekme==="sabah"?"Sabah":"Akşam"}</div>
            <div style={{display:"flex",gap:"6px",marginBottom:"10px",flexWrap:"wrap"}}>
              {IKONLAR.map(ik=><span key={ik} onClick={()=>setYeniGorevIkon(ik)} style={{fontSize:"20px",cursor:"pointer",padding:"4px",borderRadius:"8px",background:yeniGorevIkon===ik?"rgba(201,169,110,0.2)":"transparent",border:yeniGorevIkon===ik?"1px solid rgba(201,169,110,0.4)":"1px solid transparent"}}>{ik}</span>)}
            </div>
            <input style={{...S.input,marginBottom:"10px"}} placeholder="Görev adı..." value={yeniGorevMetin} onChange={e=>setYeniGorevMetin(e.target.value)} onKeyDown={e=>e.key==="Enter"&&gorevEkle(aktifSekme)}/>
            <div style={{display:"flex",gap:"8px"}}>
              <button onClick={()=>gorevEkle(aktifSekme)} style={{flex:1,padding:"10px",background:"rgba(201,169,110,0.15)",border:"1px solid rgba(201,169,110,0.3)",borderRadius:"10px",color:"#c9a96e",cursor:"pointer",fontFamily:"Georgia,serif",fontSize:"13px"}}>Ekle</button>
              <button onClick={()=>{setGorevEkleAcik(false);setYeniGorevMetin("");}} style={{padding:"10px 14px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"10px",color:"#8ba0b8",cursor:"pointer",fontFamily:"Georgia,serif",fontSize:"13px"}}>İptal</button>
            </div>
          </div>
        ):(
          <button onClick={()=>setGorevEkleAcik(true)} style={{width:"100%",padding:"12px",background:"rgba(255,255,255,0.03)",border:"1px dashed rgba(201,169,110,0.2)",borderRadius:"14px",color:"#8ba0b8",fontSize:"13px",fontFamily:"Georgia,serif",cursor:"pointer",marginBottom:"12px"}}>+ Görev Ekle</button>
        )}
        <div style={{textAlign:"center",fontSize:"11px",color:"rgba(139,160,184,0.4)",marginTop:"8px"}}>☁️ Buluta kaydediliyor</div>
      </div>
      <NavBar ekran={ekran} setEkran={setEkran}/>
    </div>
  );
}

function Yildizlar() {
  return <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0}}>{[...Array(20)].map((_,i)=><div key={i} style={{position:"absolute",width:i%4===0?"3px":"2px",height:i%4===0?"3px":"2px",borderRadius:"50%",background:"#c9a96e",opacity:Math.random()*0.35+0.05,left:`${Math.random()*100}%`,top:`${Math.random()*55}%`,animation:`twinkle ${2+Math.random()*4}s infinite`}}/>)}</div>;
}

function GeriBaslik({baslik,setEkran}) {
  return <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"24px"}}><button onClick={()=>setEkran("ana")} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"10px",padding:"8px 14px",color:"#e8d5b0",cursor:"pointer",fontSize:"18px"}}>←</button><h2 style={{margin:0,fontSize:"22px",fontWeight:"normal",color:"#e8d5b0"}}>{baslik}</h2></div>;
}

function Toggle({aktif,onChange}) {
  return <div onClick={()=>onChange(!aktif)} style={{width:"48px",height:"26px",borderRadius:"13px",background:aktif?"#c9a96e":"rgba(255,255,255,0.1)",position:"relative",cursor:"pointer",transition:"background 0.3s",flexShrink:0}}><div style={{position:"absolute",top:"3px",left:aktif?"24px":"3px",width:"20px",height:"20px",borderRadius:"50%",background:"white",transition:"left 0.3s"}}/></div>;
}

function TakvimGrid({gunlukVeri,bugun}) {
  const simdi=new Date(), yil=simdi.getFullYear(), ay=simdi.getMonth();
  const ilkGun=new Date(yil,ay,1).getDay(), gunSayisi=new Date(yil,ay+1,0).getDate();
  const ayAdi=simdi.toLocaleDateString("tr-TR",{month:"long",year:"numeric"});
  const gunler=Array.from({length:gunSayisi},(_,i)=>new Date(yil,ay,i+1).toISOString().split("T")[0]);
  return <div>
    <div style={{textAlign:"center",fontSize:"16px",color:"#e8d5b0",marginBottom:"16px",textTransform:"capitalize"}}>{ayAdi}</div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"5px",marginBottom:"16px"}}>
      {["Paz","Pzt","Sal","Çar","Per","Cum","Cmt"].map(g=><div key={g} style={{textAlign:"center",fontSize:"10px",color:"#8ba0b8",padding:"4px 0"}}>{g}</div>)}
      {Array(ilkGun).fill(null).map((_,i)=><div key={`b${i}`}/>)}
      {gunler.map(d=>{
        const tamam=gunlukVeri[d]?.tamam, bugunmu=d===bugun, gecmis=d<bugun;
        return <div key={d} style={{aspectRatio:"1",borderRadius:"8px",background:tamam?"linear-gradient(135deg,#c9a96e,#a07840)":bugunmu?"rgba(201,169,110,0.15)":"rgba(255,255,255,0.04)",border:bugunmu&&!tamam?"1px solid rgba(201,169,110,0.35)":"none",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"11px",color:tamam?"#0a0f1e":gecmis&&!tamam?"rgba(255,255,255,0.2)":"#e8d5b0"}}>{new Date(d+"T12:00:00").getDate()}</div>;
      })}
    </div>
    <div style={{display:"flex",gap:"16px",justifyContent:"center",fontSize:"12px",color:"#8ba0b8"}}>
      <span><span style={{display:"inline-block",width:"10px",height:"10px",borderRadius:"3px",background:"linear-gradient(135deg,#c9a96e,#a07840)",marginRight:"4px"}}/>Tamamlandı</span>
      <span><span style={{display:"inline-block",width:"10px",height:"10px",borderRadius:"3px",background:"rgba(201,169,110,0.15)",border:"1px solid rgba(201,169,110,0.35)",marginRight:"4px"}}/>Bugün</span>
    </div>
  </div>;
}

function NavBar({ekran,setEkran}) {
  const menu=[{key:"ana",ikon:"🏠",etiket:"Ana"},{key:"takvim",ikon:"📅",etiket:"Takvim"},{key:"istatistik",ikon:"📊",etiket:"İstatistik"},{key:"ayarlar",ikon:"⚙️",etiket:"Ayarlar"}];
  return <div style={{position:"fixed",bottom:0,left:0,right:0,background:"rgba(9,14,29,0.97)",backdropFilter:"blur(20px)",borderTop:"1px solid rgba(201,169,110,0.15)",display:"flex",justifyContent:"space-around",padding:"10px 0 20px",zIndex:50}}>
    {menu.map(m=><button key={m.key} onClick={()=>setEkran(m.key)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"3px",background:"none",border:"none",cursor:"pointer",padding:"4px 16px"}}>
      <span style={{fontSize:"20px"}}>{m.ikon}</span>
      <span style={{fontSize:"10px",color:ekran===m.key?"#c9a96e":"#8ba0b8",transition:"color 0.2s"}}>{m.etiket}</span>
    </button>)}
  </div>;
}