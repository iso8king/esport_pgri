<script>
  import { onMount } from "svelte";
  import Swal from "sweetalert2";

  // API Config
  const API_URL = "https://openmlbb.fastapicloud.dev/api";

  // Tab State
  let activeTab = "meta"; // "meta" | "counter" | "synergy" | "match"

  // Data States for General Tabs
  let heroesList = []; // All heroes cached for search & lookup { id, name, head }
  let metaHeroes = []; // Rank stats data
  let totalMetaCount = 0;
  
  // Selected Hero for Counter/Synergy tabs
  let selectedHero = null; // Current selected hero object { id, name, head }
  let counterData = null; // { strongAgainst: [], weakAgainst: [] }
  let compatibilityData = null; // { bestPartners: [], worstPartners: [] }

  // UI / Search Autocomplete State
  let searchQuery = "";
  let isSearchFocused = false;

  // Filters State for Tab 1 (Meta Hero)
  let filterDays = "7"; // "1", "3", "7", "15", "30"
  let filterRank = "all"; // "all", "epic", "legend", "mythic", "honor", "glory"
  let filterSort = "win_rate"; // "win_rate", "pick_rate", "ban_rate"
  let currentPage = 1;
  const pageSize = 12;

  // Loading States
  let loadingAllHeroes = false;
  let loadingMeta = false;
  let loadingDetail = false;

  // ==================== BATTLE ID & MATCH ANALYSIS STATES ====================
  let mlbbJwt = localStorage.getItem("mlbb_jwt") || "";
  let mlbbRoleid = localStorage.getItem("mlbb_role_id") || localStorage.getItem("user_game_id") || "";
  let mlbbZoneid = localStorage.getItem("mlbb_zone_id") || localStorage.getItem("user_server_id") || "";
  let verificationCode = "";
  let vcSent = false;
  
  let loadingSendVc = false;
  let loadingLogin = false;
  
  let seasonsList = [];
  let activeSeasonId = null;
  let matchesList = [];
  let loadingMatches = false;
  
  let selectedMatch = null; // detailed players of match
  let loadingMatchDetail = false;
  let manualMatchId = "";
  
  let selectedAnalysisHero = null; // currently selected player for counter/item analysis
  let analysisHeroCounters = [];
  let loadingAnalysisHeroCounters = false;
  let analysisHeroItemAdvice = "";
  let activeChartMetric = "damage"; // "damage" | "teamfight"

  let isMounted = false;
  let hasShownApiError = false;
  let apiErrorTimeout;
  function showApiErrorAlert(message) {
    if (hasShownApiError) return;
    hasShownApiError = true;
    Swal.fire({
      icon: "error",
      title: "Koneksi API Gagal",
      text: message,
      confirmButtonColor: "#0a2e52"
    });
    clearTimeout(apiErrorTimeout);
    apiErrorTimeout = setTimeout(() => {
      hasShownApiError = false;
    }, 3000);
  }

  // Filtered heroes list for autocomplete search
  $: searchedHeroes = searchQuery.trim() === "" 
    ? heroesList 
    : heroesList.filter(h => h.name.toLowerCase().includes(searchQuery.toLowerCase()));


  // Fetch all heroes for search lookup
  async function fetchAllHeroes() {
    loadingAllHeroes = true;
    try {
      const res = await fetch(`${API_URL}/heroes?size=200`);
      if (res.ok) {
        const json = await res.json();
        const records = json.data?.records || [];
        heroesList = records.map(r => ({
          id: r.data?.hero_id || r.hero_id,
          name: r.data?.hero?.data?.name || "Unknown",
          head: r.data?.hero?.data?.head || ""
        })).sort((a, b) => a.name.localeCompare(b.name));
        console.log("Cached heroes count:", heroesList.length);
      } else {
        throw new Error("Heroes API returned error status");
      }
    } catch (err) {
      console.error("Error fetching heroes list:", err);
      heroesList = [];
      showApiErrorAlert("Gagal mengambil daftar hero dari server API.");
    } finally {
      loadingAllHeroes = false;
    }
  }

  // Fetch Rank stats (Meta tab)
  async function fetchMetaStats() {
    loadingMeta = true;
    try {
      const res = await fetch(`${API_URL}/heroes/rank?days=${filterDays}&rank=${filterRank}&sort_field=${filterSort}&sort_order=desc&size=${pageSize}&index=${currentPage}`);
      if (res.ok) {
        const json = await res.json();
        const records = json.data?.records || [];
        totalMetaCount = json.data?.total || 0;

        metaHeroes = records.map(r => ({
          id: r.data?.main_heroid || r.main_heroid,
          name: r.data?.main_hero?.data?.name || "Unknown",
          head: r.data?.main_hero?.data?.head || "",
          winRate: r.data?.main_hero_win_rate || 0,
          pickRate: r.data?.main_hero_appearance_rate || 0,
          banRate: r.data?.main_hero_ban_rate || 0,
          subHeroes: r.data?.sub_hero || []
        }));
      } else {
        throw new Error(`HTTP error ${res.status}`);
      }
    } catch (err) {
      console.error("Error fetching meta statistics:", err);
      metaHeroes = [];
      totalMetaCount = 0;
      showApiErrorAlert("Gagal mengambil data statistik meta dari server API.");
    } finally {
      loadingMeta = false;
    }
  }

  // Fetch Counter and Synergy details for selected hero
  async function selectHero(hero) {
    selectedHero = hero;
    searchQuery = hero.name;
    isSearchFocused = false;
    loadingDetail = true;

    try {
      // 1. Fetch counters
      const counterRes = await fetch(`${API_URL}/heroes/${hero.id}/counters`);
      if (counterRes.ok) {
        const json = await counterRes.json();
        const recordData = json.data?.records?.[0]?.data || {};
        counterData = {
          strongAgainst: recordData.sub_hero || [], 
          weakAgainst: recordData.sub_hero_last || [] 
        };
      } else {
        throw new Error("Counters API returned error status");
      }

      // 2. Fetch synergies (compatibility)
      const compatRes = await fetch(`${API_URL}/heroes/${hero.id}/compatibility`);
      if (compatRes.ok) {
        const json = await compatRes.json();
        const recordData = json.data?.records?.[0]?.data || {};
        compatibilityData = {
          bestPartners: recordData.sub_hero || [],
          worstPartners: recordData.sub_hero_last || []
        };
      } else {
        throw new Error("Synergies API returned error status");
      }
    } catch (err) {
      console.error("Error loading hero details:", err);
      counterData = null;
      compatibilityData = null;
      showApiErrorAlert("Gagal memuat detail counter dan sinergi hero dari server API.");
    } finally {
      loadingDetail = false;
    }
  }

  // Lookup helper for name and head image by numeric ID
  function getHeroName(id) {
    const found = heroesList.find(h => Number(h.id) === Number(id));
    return found ? found.name : `Hero ${id}`;
  }

  function getHeroHead(id) {
    const found = heroesList.find(h => Number(h.id) === Number(id));
    return found ? found.head : "";
  }

  // Format Helper
  function formatPercentage(val) {
    return (Number(val) * 100).toFixed(2) + "%";
  }

  // Triggers when filters change
  $: if (isMounted && (filterDays || filterRank || filterSort || currentPage)) {
    if (activeTab === "meta") {
      fetchMetaStats();
    }
  }

  onMount(async () => {
    await fetchAllHeroes();
    await fetchMetaStats();
    // Default select first hero in lists for the search tab
    if (heroesList.length > 0) {
      selectHero(heroesList[0]);
    }
    // If user is already logged into MLBB API, fetch matches history
    if (mlbbJwt) {
      loadMatchesHistory();
    }
    isMounted = true;
  });

  // Tab switcher
  function setTab(tab) {
    activeTab = tab;
    if (tab === "meta") {
      fetchMetaStats();
    }
  }

  // Pagination triggers
  function nextPage() {
    if (currentPage * pageSize < totalMetaCount) {
      currentPage += 1;
    }
  }

  function prevPage() {
    if (currentPage > 1) {
      currentPage -= 1;
    }
  }

  // ==================== BATTLE ID & MATCH ANALYSIS LOGIC ====================
  
  // 1. Send VC Code to Game Box
  async function sendVc() {
    if (!mlbbRoleid || !mlbbZoneid) {
      Swal.fire({
        icon: "warning",
        title: "Peringatan",
        text: "Game ID dan Zone ID tidak boleh kosong!",
        confirmButtonColor: "#0a2e52"
      });
      return;
    }
    
    loadingSendVc = true;
    try {
      const res = await fetch(`${API_URL}/user/auth/send-vc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role_id: Number(mlbbRoleid),
          zone_id: Number(mlbbZoneid)
        })
      });
      const json = await res.json();
      if (res.ok && json.code === 0) {
        vcSent = true;
        Swal.fire({
          icon: "success",
          title: "Kode Terkirim!",
          text: "Silakan cek inbox (kotak masuk surat) di dalam game Mobile Legends Anda. Kode berlaku 5 menit.",
          confirmButtonColor: "#0b5ba2"
        });
      } else {
        throw new Error(json.message || "Gagal mengirim kode verifikasi.");
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Gagal menghubungi server MLBB.",
        confirmButtonColor: "#0a2e52"
      });
    } finally {
      loadingSendVc = false;
    }
  }

  // 2. Submit Verification Code to Log In and get JWT
  async function loginMlbb() {
    if (!verificationCode) {
      Swal.fire({
        icon: "warning",
        title: "Peringatan",
        text: "Masukkan kode verifikasi terlebih dahulu!",
        confirmButtonColor: "#0a2e52"
      });
      return;
    }

    loadingLogin = true;
    try {
      const res = await fetch(`${API_URL}/user/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role_id: Number(mlbbRoleid),
          zone_id: Number(mlbbZoneid),
          vc: Number(verificationCode)
        })
      });
      const json = await res.json();
      if (res.ok && json.code === 0) {
        const jwt = json.data?.jwt || json.data?.token;
        if (!jwt) {
          throw new Error("Token JWT tidak ditemukan di respon server.");
        }
        // Save to state and storage
        mlbbJwt = jwt;
        localStorage.setItem("mlbb_jwt", jwt);
        localStorage.setItem("mlbb_role_id", String(mlbbRoleid));
        localStorage.setItem("mlbb_zone_id", String(mlbbZoneid));

        Swal.fire({
          icon: "success",
          title: "Berhasil Terhubung!",
          text: "Akun Mobile Legends Anda sukses diverifikasi.",
          timer: 1500,
          showConfirmButton: false
        });

        verificationCode = "";
        vcSent = false;
        await loadMatchesHistory();
      } else {
        throw new Error(json.message || "Kode verifikasi salah atau sudah kadaluwarsa.");
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Gagal Login",
        text: err.message,
        confirmButtonColor: "#0a2e52"
      });
    } finally {
      loadingLogin = false;
    }
  }

  // 3. Load Matches History list
  async function loadMatchesHistory() {
    if (!mlbbJwt) return;
    loadingMatches = true;
    try {
      // Step A: Load seasons list first if not already loaded
      if (seasonsList.length === 0) {
        const seasonRes = await fetch(`${API_URL}/user/season`, {
          headers: { "Authorization": `Bearer ${mlbbJwt}` }
        });
        
        if (seasonRes.ok) {
          const seasonJson = await seasonRes.json();
          // Sort descending to ensure the latest season is at index 0
          seasonsList = (seasonJson.data?.sids || []).sort((a, b) => b - a);
          if (seasonsList.length > 0 && !activeSeasonId) {
            activeSeasonId = seasonsList[0];
          }
        }
      }

      if (!activeSeasonId) {
        activeSeasonId = 40;
      }

      // Step B: Load recent matches
      const matchesRes = await fetch(`${API_URL}/user/matches?sid=${activeSeasonId}&limit=10`, {
        headers: { "Authorization": `Bearer ${mlbbJwt}` }
      });
      
      if (matchesRes.ok) {
        const matchesJson = await matchesRes.json();
        matchesList = matchesJson.data?.result || [];
        
        // Auto select first match detail if available
        if (matchesList.length > 0) {
          selectMatchDetail(matchesList[0].bid_s || matchesList[0].bid);
        } else {
          selectedMatch = null;
        }
      } else {
        if (matchesRes.status === 401 || matchesRes.status === 403) {
          // Token expired, force re-login
          disconnectMlbb();
        }
      }
    } catch (err) {
      console.error("Error loading matches history:", err);
    } finally {
      loadingMatches = false;
    }
  }

  // 4. Load Match Scoreboard Details
  async function selectMatchDetail(matchId) {
    if (!matchId) return;
    manualMatchId = matchId;
    loadingMatchDetail = true;
    try {
      const res = await fetch(`${API_URL}/user/matches/${matchId}?sid=${activeSeasonId || 40}`, {
        headers: { "Authorization": `Bearer ${mlbbJwt}` }
      });
      if (res.ok) {
        const json = await res.json();
        selectedMatch = json.data?.result || [];
        
        // Auto select the enemy MVP for counter analysis by default
        const currentMatchInfo = matchesList.find(m => String(m.bid_s || m.bid) === String(manualMatchId));
        const userHeroName = currentMatchInfo?.hid_e?.n;
        const userPlayer = selectedMatch.find(p => p.hid_e?.n === userHeroName);
        const userTeamFlag = userPlayer?.f || 1;
        const enemyTeam = selectedMatch.filter(p => p.f !== userTeamFlag);
        
        if (enemyTeam.length > 0) {
          const enemyHighestKills = Math.max(...enemyTeam.map(p => p.k), 0);
          const enemyMvpObj = enemyTeam.find(p => p.k === enemyHighestKills) || enemyTeam[0];
          await selectAnalysisHero(enemyMvpObj);
        } else if (selectedMatch.length > 0) {
          await selectAnalysisHero(selectedMatch[0]);
        } else {
          selectedAnalysisHero = null;
          analysisHeroCounters = [];
          analysisHeroItemAdvice = "";
        }
      } else {
        throw new Error("Gagal mengambil detail pertandingan.");
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Gagal Memuat Detail",
        text: "Pastikan Battle ID pertandingan valid dan sesuai season ini.",
        confirmButtonColor: "#0a2e52"
      });
    } finally {
      loadingMatchDetail = false;
    }
  }

  // Fetch counter-picks and build item advice for any selected scoreboard hero
  async function selectAnalysisHero(player) {
    selectedAnalysisHero = player;
    analysisHeroCounters = [];
    analysisHeroItemAdvice = "";
    
    const heroId = player.hid || player.hid_e?.id;
    const heroName = player.hid_e?.n || "";
    if (!heroId) return;
    
    // Counter defensive item suggestions based on hero elements
    const magicalHeroes = [
      "aamon", "alice", "angela", "aurora", "belerick", "carmilla", "cecilion", "chang'e", "chip", "cyclops", 
      "diggie", "edith", "esmeralda", "estes", "eudora", "faramis", "floryn", "gloo", "gord", "guinevere", 
      "gusion", "harith", "harley", "hylos", "johnson", "joy", "julian", "kadita", "kagura", "kaja", 
      "karina", "kimmy", "lolita", "lunox", "luo yi", "lylia", "mathilda", "nana", "natan", "novaria", 
      "odette", "pharsa", "phoveus", "rafaela", "selena", "silvanna", "uranus", "vale", "valentina", 
      "valir", "vexana", "xavier", "yve", "zhask", "zhuxin"
    ];
    const regenHeroes = [
      "alpha", "alucard", "angela", "arlott", "balmond", "belerick", "carmilla", "cici", "dyrroth", "esmeralda", 
      "estes", "floryn", "freya", "gatotkaca", "hilda", "hylos", "khaleed", "lapu-lapu", "masha", "minotaur", 
      "rafaela", "ruby", "terizla", "thamuz", "uranus", "yu zhong", "x.borg", "alice"
    ];

    const isMagical = magicalHeroes.includes(heroName.toLowerCase().trim());
    const isRegen = regenHeroes.includes(heroName.toLowerCase().trim());

    if (isRegen) {
      if (isMagical) {
        analysisHeroItemAdvice = `Hero ini menghasilkan magic damage dan memiliki HP regen/lifesteal tinggi. Disarankan membeli Dominance Ice (anti-regen) serta Athena's Shield atau Radiant Armor.`;
      } else {
        analysisHeroItemAdvice = `Hero ini menghasilkan physical damage dan memiliki HP regen/lifesteal tinggi. Disarankan membeli Dominance Ice (anti-regen) serta Antique Cuirass atau Blade Armor.`;
      }
    } else if (isMagical) {
      analysisHeroItemAdvice = `Hero ini menghasilkan magic damage yang dominan. Disarankan membeli Athena's Shield atau Radiant Armor untuk mengurangi damage serangan sihir mereka.`;
    } else {
      analysisHeroItemAdvice = `Hero ini menghasilkan physical damage yang dominan. Disarankan membuat item pertahanan seperti Antique Cuirass, Blade Armor, atau Wind of Nature.`;
    }
    
    
    loadingAnalysisHeroCounters = true;
    try {
      const res = await fetch(`${API_URL}/heroes/${heroId}/counters`);
      if (res.ok) {
        const json = await res.json();
        const recordData = json.data?.records?.[0]?.data || {};
        const strongAgainst = recordData.sub_hero || [];
        analysisHeroCounters = strongAgainst.slice(0, 3).map(sub => ({
          id: sub.heroid,
          name: getHeroName(sub.heroid),
          head: getHeroHead(sub.heroid) || sub.hero?.data?.head || "",
          winRate: sub.hero_win_rate,
          increase: sub.increase_win_rate
        }));
      } else {
        throw new Error(`API error ${res.status}`);
      }
    } catch (err) {
      console.error("Error loading counters for analysis hero:", err);
      analysisHeroCounters = [];
      showApiErrorAlert("Gagal memuat rekomendasi counter-pick hero dari server API.");
    } finally {
      loadingAnalysisHeroCounters = false;
    }
  }

  // Toggle selection/expansion of hero row in scoreboard
  async function toggleAnalysisHero(player) {
    if (selectedAnalysisHero && selectedAnalysisHero.rname === player.rname) {
      selectedAnalysisHero = null;
      analysisHeroCounters = [];
      analysisHeroItemAdvice = "";
    } else {
      await selectAnalysisHero(player);
    }
  }

  // 5. Disconnect Account
  function disconnectMlbb() {
    mlbbJwt = "";
    localStorage.removeItem("mlbb_jwt");
    localStorage.removeItem("mlbb_role_id");
    localStorage.removeItem("mlbb_zone_id");
    matchesList = [];
    selectedMatch = null;
    selectedAnalysisHero = null;
    analysisHeroCounters = [];
    analysisHeroItemAdvice = "";
    vcSent = false;
    verificationCode = "";
    Swal.fire({
      icon: "info",
      title: "Terputus",
      text: "Koneksi akun MLBB berhasil dibersihkan.",
      confirmButtonColor: "#0a2e52"
    });
  }

  // Helper formatting match date
  function formatTimestamp(unixTime) {
    if (!unixTime) return "-";
    const date = new Date(Number(unixTime) * 1000);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function formatDuration(seconds) {
    if (!seconds) return "0m";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  }

  // Reactive Match Tactical Analysis
  $: matchAnalysis = (() => {
    if (!selectedMatch || selectedMatch.length === 0) return null;
    
    // Find the current player's match info & character data
    const currentMatchInfo = matchesList.find(m => String(m.bid_s || m.bid) === String(manualMatchId));
    const userHeroName = currentMatchInfo?.hid_e?.n;
    const userPlayer = selectedMatch.find(p => p.hid_e?.n === userHeroName);
    
    // Calculate team totals
    const team1 = selectedMatch.filter(p => p.f === 1);
    const team2 = selectedMatch.filter(p => p.f === 2);
    
    const t1Kills = team1.reduce((sum, p) => sum + p.k, 0);
    const t1Deaths = team1.reduce((sum, p) => sum + p.d, 0);
    const t1Damage = team1.reduce((sum, p) => sum + p.o, 0);
    
    const t2Kills = team2.reduce((sum, p) => sum + p.k, 0);
    const t2Deaths = team2.reduce((sum, p) => sum + p.d, 0);
    const t2Damage = team2.reduce((sum, p) => sum + p.o, 0);
    
    const userTeamFlag = userPlayer?.f || 1;
    const userWon = userPlayer?.fw === 1;
    const isUserMvp = userPlayer?.mvp === 1;
    
    let title = userWon ? "Victory" : "Defeat";
    let statusColor = userWon ? "text-emerald-700 bg-emerald-50 border border-emerald-200" : "text-rose-700 bg-rose-50 border border-rose-200";
    let summaryMessage = "";
    let adviceList = [];
    
    if (userPlayer) {
      const kdaRatio = (userPlayer.k + userPlayer.a) / Math.max(1, userPlayer.d);
      
      if (isUserMvp) {
        summaryMessage = `Pemain ${userPlayer.rname} meraih MVP pertandingan menggunakan hero ${userHeroName} dengan catatan statistik K/D/A: ${userPlayer.k}/${userPlayer.d}/${userPlayer.a}.`;
      } else {
        summaryMessage = `Pemain ${userPlayer.rname} menyelesaikan pertandingan menggunakan hero ${userHeroName} dengan catatan statistik K/D/A: ${userPlayer.k}/${userPlayer.d}/${userPlayer.a}.`;
      }
      
      if (kdaRatio >= 4.5) {
        adviceList.push(`Efisiensi eliminasi optimal (Rasio KDA: ${kdaRatio.toFixed(2)}).`);
      } else if (userPlayer.d >= 6) {
        adviceList.push(`Angka kematian tinggi (${userPlayer.d} Death). Disarankan meningkatkan kewaspadaan posisi.`);
      }
      
      if (userPlayer.tfr >= 0.70) {
        adviceList.push(`Partisipasi team fight aktif (${(userPlayer.tfr * 100).toFixed(0)}%).`);
      } else if (userPlayer.tfr < 0.40) {
        adviceList.push(`Partisipasi team fight relatif rendah (${(userPlayer.tfr * 100).toFixed(0)}%). Perlu back-up tim lebih cepat.`);
      }
      
      if (userPlayer.op >= 0.25) {
        adviceList.push(`Kontribusi damage dominan (${(userPlayer.op * 100).toFixed(0)}% damage tim).`);
      }
      
      const enemyTeam = userTeamFlag === 1 ? team2 : team1;
      const enemyHighestKills = Math.max(...enemyTeam.map(p => p.k), 0);
      const enemyMvpObj = enemyTeam.find(p => p.k === enemyHighestKills);
      
      if (enemyMvpObj && enemyHighestKills >= 5) {
        adviceList.push(`Target prioritas lawan: ${enemyMvpObj.rname} (${enemyMvpObj.hid_e?.n || 'Hero musuh'}) dengan ${enemyHighestKills} Kills.`);
      }
    } else {
      summaryMessage = `Data statistik untuk pertandingan Battle ID ${manualMatchId}.`;
      if (t1Kills > t2Kills) {
        adviceList.push("Tim A mendominasi total eliminasi.");
      } else {
        adviceList.push("Tim B mendominasi total eliminasi.");
      }
    }
    
    return {
      title,
      statusColor,
      summaryMessage,
      adviceList
    };
  })();

  // Reactive dictionary of item images in the current scoreboard to use as primary source
  $: matchItemImages = (() => {
    const dict = {};
    if (!selectedMatch) return dict;
    for (const player of selectedMatch) {
      if (player.its_e) {
        for (const item of player.its_e) {
          if (item && item.n && item.ix) {
            dict[item.n.toLowerCase().trim()] = item.ix;
          }
        }
      }
    }
    return dict;
  })();

  // Static Moonton CDN image URLs for core defensive items to bypass Fandom hotlink blocks
  const itemStaticImages = {
    "radiant armor": "https://akmweb.youngjoygame.com/web/svnres/img/mlbb/homepage/100_2235566ea07c98eeece80a2cb56c296f.png",
    "immortality": "https://akmweb.youngjoygame.com/web/svnres/img/mlbb/homepage/100_cc8a7730e6d539ac10d2e0ed91bf2785.png",
    "dominance ice": "https://akmweb.youngjoygame.com/web/svnres/img/mlbb/homepage/100_1b1672399a7836284effcc60aaddd7de.png",
    "athena's shield": "https://akmweb.youngjoygame.com/web/svnres/img/mlbb/homepage/100_d9bb48a8df64ae5065d370adca6a5153.png",
    "oracle": "https://akmweb.youngjoygame.com/web/svnres/img/mlbb/homepage/100_bc24b55abbbec6da408eb0ea5c37cad4.png",
    "antique cuirass": "https://akmweb.youngjoygame.com/web/svnres/img/mlbb/homepage/100_f20c5fef57268ccb59a1b818c0b0c769.png",
    "glowing wand": "https://akmweb.youngjoygame.com/web/svnres/img/mlbb/homepage_92/100_df12c0f80844640a7b40cf64798be915.png",
    "sea halberd": "https://akmweb.youngjoygame.com/web/svnres/img/mlbb/homepage/100_d78fb27df8def66bd1460e851bfbf7a9.png",
    "blade armor": "https://akmweb.youngjoygame.com/web/svnres/img/mlbb/homepage/100_29d321d8fe1089a93f0e3f3c5a838ebd.png",
    "wind of nature": "https://akmweb.youngjoygame.com/web/svnres/img/mlbb/homepage/100_ae8965c4fc07454431c6b1f129c7d1ae.png"
  };

  // Helper to resolve item image dynamically
  function getItemImage(itemName) {
    const cleaned = itemName.toLowerCase().trim();
    // 1. Try static known map (fastest and handles all recommended defense items)
    if (itemStaticImages[cleaned]) {
      return itemStaticImages[cleaned];
    }
    // 2. Try match scoreboard items (if bought by players in current game)
    if (matchItemImages[cleaned]) {
      return matchItemImages[cleaned];
    }
    // 3. Fallback to default asset
    return "/logo1.png";
  }

  // Recommended defensive items based on active analyzed hero
  $: analysisHeroRecommendedItems = (() => {
    if (!selectedAnalysisHero) return [];
    
    const heroName = (selectedAnalysisHero.hid_e?.n || "").toLowerCase().trim();
    
    const magicalHeroes = [
      "aamon", "alice", "angela", "aurora", "belerick", "carmilla", "cecilion", "chang'e", "chip", "cyclops", 
      "diggie", "edith", "esmeralda", "estes", "eudora", "faramis", "floryn", "gloo", "gord", "guinevere", 
      "gusion", "harith", "harley", "hylos", "johnson", "joy", "julian", "kadita", "kagura", "kaja", 
      "karina", "kimmy", "lolita", "lunox", "luo yi", "lylia", "mathilda", "nana", "natan", "novaria", 
      "odette", "pharsa", "phoveus", "rafaela", "selena", "silvanna", "uranus", "vale", "valentina", 
      "valir", "vexana", "xavier", "yve", "zhask", "zhuxin"
    ];
    const regenHeroes = [
      "alpha", "alucard", "angela", "arlott", "balmond", "belerick", "carmilla", "cici", "dyrroth", "esmeralda", 
      "estes", "floryn", "freya", "gatotkaca", "hilda", "hylos", "khaleed", "lapu-lapu", "masha", "minotaur", 
      "rafaela", "ruby", "terizla", "thamuz", "uranus", "yu zhong", "x.borg", "alice"
    ];

    const isMagical = magicalHeroes.includes(heroName);
    const isRegen = regenHeroes.includes(heroName);

    if (isRegen) {
      if (isMagical) {
        return [
          { name: "Dominance Ice", desc: "Anti-Regen & Attack Speed Slow" },
          { name: "Athena's Shield", desc: "Magic Def (vs Burst Magic)" },
          { name: "Radiant Armor", desc: "Magic Def (vs Continuous Magic)" }
        ];
      } else {
        return [
          { name: "Dominance Ice", desc: "Anti-Regen & Physical Def" },
          { name: "Antique Cuirass", desc: "Physical Def (vs Skills)" },
          { name: "Blade Armor", desc: "Physical Def (vs Basic Attack)" }
        ];
      }
    } else if (isMagical) {
      return [
        { name: "Athena's Shield", desc: "Magic Def (vs Burst Magic)" },
        { name: "Radiant Armor", desc: "Magic Def (vs Continuous Magic)" },
        { name: "Oracle", desc: "Magic Def (Regen/Shield Boost)" }
      ];
    } else {
      return [
        { name: "Antique Cuirass", desc: "Physical Def (vs Skills)" },
        { name: "Blade Armor", desc: "Physical Def (vs Basic Attack)" },
        { name: "Wind of Nature", desc: "Physical Imun (Marksman/DPS)" }
      ];
    }
  })();

  // Reactive helper states for team player charts and max damage in match
  $: chartTeam1Players = selectedMatch ? selectedMatch.filter(p => p.f === 1) : [];
  $: chartTeam2Players = selectedMatch ? selectedMatch.filter(p => p.f === 2) : [];
  $: chartMaxDamage = selectedMatch && selectedMatch.length > 0 ? Math.max(...selectedMatch.map(pl => pl.o), 1) : 1;

  // Sorted players (Team 1 first, then Team 2)
  $: sortedPlayers = selectedMatch ? [...selectedMatch].sort((a, b) => a.f - b.f) : [];

  // Active metric for match statistics visualization ("kda" | "damage" | "teamfight" | "score")
  let activeStatsMetric = "kda";

  // Build the list of stats for the active metric reactively
  $: chartDataList = sortedPlayers.map(p => {
    let val = 0;
    if (activeStatsMetric === "kda") {
      val = Number(((p.k + p.a) / Math.max(1, p.d)).toFixed(2));
    } else if (activeStatsMetric === "damage") {
      val = p.o;
    } else if (activeStatsMetric === "teamfight") {
      val = Number((p.tfr * 100).toFixed(2));
    } else if (activeStatsMetric === "score") {
      val = p.s;
    }
    return {
      name: p.rname || "Unknown",
      value: val,
      team: p.f,
      hero: p.hid_e?.n || "Hero",
      k: p.k,
      d: p.d,
      a: p.a
    };
  });

  // Calculate scaling constraints for chart
  $: chartMetricMax = chartDataList.length > 0 ? Math.max(...chartDataList.map(pl => pl.value), 1) : 1;
  $: chartMetricYMax = (() => {
    if (activeStatsMetric === "teamfight") return 100;
    if (activeStatsMetric === "kda") return Math.ceil(Math.max(chartMetricMax, 5));
    // Pad other numerical fields slightly
    return Math.ceil(chartMetricMax * 1.08);
  })();

  // Helper formatting axis & bar text values
  function formatChartValue(val) {
    if (val >= 1000000) {
      return (val / 1000000).toFixed(1) + "M";
    }
    if (val >= 1000) {
      return (val / 1000).toFixed(0) + "k";
    }
    return val.toFixed(0);
  }

  // Format label value for the bars specifically
  function formatBarValue(val) {
    if (activeStatsMetric === "kda") return val.toFixed(2);
    if (activeStatsMetric === "teamfight") return val.toFixed(0) + "%";
    if (activeStatsMetric === "damage") {
      if (val >= 1000) return (val / 1000).toFixed(0) + "k";
      return val.toFixed(0);
    }
    return val.toFixed(0);
  }
</script>

<div class="space-y-8 max-w-[1440px] w-full mx-auto">
  
  <!-- Banner Header -->
  <div class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0a2e52] to-[#164e87] text-white p-8 shadow-lg border border-white/10">
    <div class="absolute -right-16 -top-16 w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>
    <div class="relative z-10 space-y-2">
      <div class="flex items-center gap-2">
        <span class="px-2.5 py-0.5 text-xs font-bold text-cyan-200 bg-cyan-950/50 border border-cyan-800/50 rounded-full uppercase tracking-wider">SMEGIONE ANALISIS</span>
      </div>
      <h1 class="text-3xl md:text-4xl font-extrabold tracking-tight">Dashboard Analisis MLBB</h1>
      <p class="text-sm md:text-base text-zinc-200 max-w-2xl leading-relaxed">
        Analisis data statistik hero, counter-pick, sinergi tim, serta performa pertandingan secara riil.
      </p>
    </div>
  </div>

  <!-- Navigation Tabs -->
  <div class="flex flex-wrap gap-2 p-1.5 bg-gray-100 rounded-xl max-w-2xl shadow-sm border border-gray-200/50">
    <button 
      on:click={() => setTab("meta")}
      class="flex-1 min-w-[80px] py-2.5 text-xs md:text-sm font-bold transition-all duration-200 rounded-lg {activeTab === 'meta' ? 'bg-[#0a2e52] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'}"
    >
      Meta Hero
    </button>
    <button 
      on:click={() => setTab("counter")}
      class="flex-1 min-w-[80px] py-2.5 text-xs md:text-sm font-bold transition-all duration-200 rounded-lg {activeTab === 'counter' ? 'bg-[#0a2e52] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'}"
    >
      Counter Hero
    </button>
    <button 
      on:click={() => setTab("synergy")}
      class="flex-1 min-w-[80px] py-2.5 text-xs md:text-sm font-bold transition-all duration-200 rounded-lg {activeTab === 'synergy' ? 'bg-[#0a2e52] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'}"
    >
      Sinergi Tim
    </button>
    <button 
      on:click={() => setTab("match")}
      class="flex-1 min-w-[100px] py-2.5 text-xs md:text-sm font-bold transition-all duration-200 rounded-lg {activeTab === 'match' ? 'bg-[#0a2e52] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'}"
    >
      Analisis Match
    </button>
  </div>

  <!-- Content Section -->
  {#if activeTab === "meta"}
    <!-- TAB 1: META STATISTICS -->
    <div class="space-y-6 animate-fade-in">
      
      <!-- Filter controls -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white border border-gray-200 p-5 rounded-2xl shadow-sm">
        
        <!-- Days Filter -->
        <div class="space-y-2">
          <span class="text-xs font-bold text-gray-500 uppercase tracking-wider block">Rentang Waktu</span>
          <div class="relative">
            <select 
              bind:value={filterDays}
              class="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 focus:outline-none focus:border-[#0a2e52] transition-colors"
            >
              <option value="1">1 Hari Terakhir</option>
              <option value="3">3 Hari Terakhir</option>
              <option value="7">7 Hari Terakhir</option>
              <option value="15">15 Hari Terakhir</option>
              <option value="30">30 Hari Terakhir</option>
            </select>
            <span class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">▼</span>
          </div>
        </div>

        <!-- Rank Filter -->
        <div class="space-y-2">
          <span class="text-xs font-bold text-gray-500 uppercase tracking-wider block">Tingkatan Rank</span>
          <div class="relative">
            <select 
              bind:value={filterRank}
              class="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 focus:outline-none focus:border-[#0a2e52] transition-colors"
            >
              <option value="all">Semua Rank</option>
              <option value="epic">Epic</option>
              <option value="legend">Legend</option>
              <option value="mythic">Mythic</option>
              <option value="honor">Mythic Honor</option>
              <option value="glory">Mythic Glory</option>
            </select>
            <span class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">▼</span>
          </div>
        </div>

        <!-- Sort By -->
        <div class="space-y-2">
          <span class="text-xs font-bold text-gray-500 uppercase tracking-wider block">Urutkan Berdasarkan</span>
          <div class="relative">
            <select 
              bind:value={filterSort}
              class="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 focus:outline-none focus:border-[#0a2e52] transition-colors"
            >
              <option value="win_rate">Win Rate tertinggi</option>
              <option value="pick_rate">Pick Rate tertinggi</option>
              <option value="ban_rate">Ban Rate tertinggi</option>
            </select>
            <span class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">▼</span>
          </div>
        </div>

      </div>

      <!-- Hero list loading / content -->
      {#if loadingMeta}
        <div class="flex flex-col items-center justify-center p-20 bg-white border border-gray-200 rounded-2xl shadow-sm">
          <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0a2e52]"></div>
          <p class="mt-4 text-sm font-medium text-gray-500">Memuat analisis statistik hero...</p>
        </div>
      {:else if metaHeroes.length === 0}
        <div class="p-12 bg-white border border-gray-200 text-center rounded-2xl shadow-sm">
          <p class="text-gray-500">Data statistik tidak ditemukan untuk filter ini.</p>
        </div>
      {:else}
        <!-- Grid Hero Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {#each metaHeroes as hero, idx}
            <div class="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-[#0a2e52]/30 transition-all duration-300 flex flex-col justify-between relative group">
              <!-- Rank Label -->
              <span class="absolute top-4 right-4 bg-gray-100 group-hover:bg-[#0a2e52] group-hover:text-white transition-colors duration-300 font-black text-xs px-2.5 py-1 rounded-lg text-gray-500 shadow-sm">
                #{ (currentPage - 1) * pageSize + idx + 1 }
              </span>

              <div class="flex items-center gap-4">
                <img 
                  src={hero.head} 
                  alt={hero.name} 
                  class="w-16 h-16 rounded-2xl object-cover bg-gray-50 border border-gray-200 shadow-sm shrink-0" 
                  on:error={(e) => e.target.src = "/logo1.png"}
                />
                <div>
                  <h3 class="text-base font-extrabold text-gray-800 tracking-tight">{hero.name}</h3>
                  <p class="text-xs text-gray-400 font-semibold">Hero ID: {hero.id}</p>
                </div>
              </div>

              <!-- Stats meters -->
              <div class="mt-6 space-y-3.5">
                <!-- Win Rate -->
                <div class="space-y-1">
                  <div class="flex justify-between text-xs font-extrabold">
                    <span class="text-gray-500">Win Rate</span>
                    <span class="text-emerald-600">{formatPercentage(hero.winRate)}</span>
                  </div>
                  <div class="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div class="h-full bg-emerald-500 rounded-full" style="width: {hero.winRate * 100}%"></div>
                  </div>
                </div>

                <!-- Pick Rate -->
                <div class="space-y-1">
                  <div class="flex justify-between text-xs font-extrabold">
                    <span class="text-gray-500">Pick Rate</span>
                    <span class="text-blue-600">{formatPercentage(hero.pickRate)}</span>
                  </div>
                  <div class="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div class="h-full bg-blue-500 rounded-full" style="width: {Math.min(hero.pickRate * 1000, 100)}%"></div>
                  </div>
                </div>

                <!-- Ban Rate -->
                <div class="space-y-1">
                  <div class="flex justify-between text-xs font-extrabold">
                    <span class="text-gray-500">Ban Rate</span>
                    <span class="text-rose-600">{formatPercentage(hero.banRate)}</span>
                  </div>
                  <div class="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div class="h-full bg-rose-500 rounded-full" style="width: {Math.min(hero.banRate * 100, 100)}%"></div>
                  </div>
                </div>
              </div>

              <!-- Helper links for counters & synergies -->
              <div class="mt-6 pt-4 border-t border-gray-100 flex gap-2">
                <button 
                  on:click={() => { setTab("counter"); selectHero({ id: hero.id, name: hero.name, head: hero.head }); }}
                  class="flex-1 py-2 text-center text-xs font-bold bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 text-gray-700 tracking-wide transition-colors"
                >
                  Cari Counter
                </button>
                <button 
                  on:click={() => { setTab("synergy"); selectHero({ id: hero.id, name: hero.name, head: hero.head }); }}
                  class="flex-1 py-2 text-center text-xs font-bold bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 text-gray-700 tracking-wide transition-colors"
                >
                  Lihat Rekan
                </button>
              </div>

            </div>
          {/each}
        </div>

        <!-- Pagination -->
        {#if totalMetaCount > pageSize}
          <div class="flex justify-center items-center gap-4 mt-8 pt-4">
            <button 
              on:click={prevPage}
              disabled={currentPage === 1}
              class="px-4 py-2 text-sm font-bold border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-sm transition-all"
            >
              Sebelumnya
            </button>
            <span class="text-sm font-bold text-gray-500">Halaman {currentPage} dari {Math.ceil(totalMetaCount / pageSize)}</span>
            <button 
              on:click={nextPage}
              disabled={currentPage * pageSize >= totalMetaCount}
              class="px-4 py-2 text-sm font-bold border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-sm transition-all"
            >
              Selanjutnya
            </button>
          </div>
        {/if}

      {/if}

    </div>
  {:else if activeTab === "counter" || activeTab === "synergy"}
    <!-- TABS 2 & 3: COUNTERS & SYNERGIES (Both require selecting a hero) -->
    <div class="space-y-8 animate-fade-in">
      
      <!-- Hero Autocomplete Search Bar -->
      <div class="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm space-y-4 max-w-xl">
        <span class="text-xs font-extrabold text-gray-500 uppercase tracking-wider block">Cari Hero MLBB</span>
        
        <div class="relative">
          <div class="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus-within:border-[#0a2e52] focus-within:bg-white transition-all shadow-inner">
            <svg class="w-4 h-4 text-gray-400 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text"
              bind:value={searchQuery}
              on:focus={() => isSearchFocused = true}
              placeholder="Masukkan nama hero (misal: Fanny, Ling, Miya)..."
              class="w-full bg-transparent text-sm font-bold text-gray-700 outline-none"
            />
            {#if searchQuery}
              <button 
                on:click={() => { searchQuery = ""; selectedHero = null; }}
                class="text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                ✕
              </button>
            {/if}
          </div>

          <!-- Suggestions Dropdown -->
          {#if isSearchFocused && searchedHeroes.length > 0}
            <div class="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-30 max-h-60 overflow-y-auto divide-y divide-gray-100 no-scrollbar">
              {#each searchedHeroes as hero}
                <button 
                  on:click={() => selectHero(hero)}
                  class="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-left transition-colors"
                >
                  <img 
                    src={hero.head} 
                    alt={hero.name} 
                    class="w-8 h-8 rounded-lg object-cover bg-gray-100 border border-gray-100"
                    on:error={(e) => e.target.src = "/logo1.png"}
                  />
                  <span class="text-sm font-bold text-gray-800">{hero.name}</span>
                </button>
              {/each}
            </div>
          {/if}
        </div>
      </div>

      <!-- Detail Results -->
      {#if loadingDetail}
        <div class="flex flex-col items-center justify-center p-20 bg-white border border-gray-200 rounded-2xl shadow-sm">
          <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0a2e52]"></div>
          <p class="mt-4 text-sm font-medium text-gray-500">Menganalisis kecocokan data hero...</p>
        </div>
      {:else if !selectedHero}
        <div class="p-12 bg-white border border-gray-200 text-center rounded-2xl shadow-sm text-gray-400">
          <p class="font-semibold">Silakan cari dan pilih hero di atas untuk memulai analisis.</p>
        </div>
      {:else}
        
        <!-- Target Hero Profile Card -->
        <div class="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex items-center gap-5 max-w-md">
          <img 
            src={selectedHero.head} 
            alt={selectedHero.name} 
            class="w-20 h-20 rounded-2xl object-cover bg-gray-50 border border-gray-200 shadow-md"
            on:error={(e) => e.target.src = "/logo1.png"}
          />
          <div class="space-y-1">
            <h2 class="text-2xl font-black text-gray-800 tracking-tight">{selectedHero.name}</h2>
            <span class="text-xs font-bold text-gray-400 bg-gray-100 border px-2 py-0.5 rounded-full inline-block">Hero ID: {selectedHero.id}</span>
          </div>
        </div>

        <!-- Render Tab 2 (Counter) -->
        {#if activeTab === "counter" && counterData}
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            <!-- Strong Counters (Hero yang Kuat Melawan) -->
            <div class="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
              <div class="space-y-1">
                <h3 class="text-lg font-black text-rose-600 flex items-center gap-2">
                  Strong Against {selectedHero.name} (Counter Hero)
                </h3>
                <p class="text-xs font-semibold text-gray-400">Hero yang performa statistiknya meningkat drastis ketika melawan {selectedHero.name}.</p>
              </div>

              {#if counterData.strongAgainst.length === 0}
                <p class="text-sm text-gray-500 italic">Data counter tidak tersedia.</p>
              {:else}
                <div class="divide-y divide-gray-100">
                  {#each counterData.strongAgainst as sub}
                    <div class="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                      <div class="flex items-center gap-3">
                        <img 
                          src={getHeroHead(sub.heroid)} 
                          alt="Sub Hero" 
                          class="w-10 h-10 rounded-xl object-cover border border-gray-200"
                          on:error={(e) => e.target.src = sub.hero?.data?.head || "/logo1.png"}
                        />
                        <div>
                          <p class="text-sm font-extrabold text-gray-800">{getHeroName(sub.heroid)}</p>
                          <p class="text-[11px] font-semibold text-gray-400">Win Rate: {formatPercentage(sub.hero_win_rate)}</p>
                        </div>
                      </div>
                      <span class="text-xs font-bold text-rose-500 bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-lg">
                        +{ (sub.increase_win_rate * 100).toFixed(2) }% Win Rate
                      </span>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>

            <!-- Weak Against (Hero yang Lemah Melawan) -->
            <div class="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
              <div class="space-y-1">
                <h3 class="text-lg font-black text-emerald-600 flex items-center gap-2">
                  Weak Against {selectedHero.name} (Lawan Mudah)
                </h3>
                <p class="text-xs font-semibold text-gray-400">Hero yang performa statistiknya menurun drastis ketika berhadapan dengan {selectedHero.name}.</p>
              </div>

              {#if counterData.weakAgainst.length === 0}
                <p class="text-sm text-gray-500 italic">Data tidak tersedia.</p>
              {:else}
                <div class="divide-y divide-gray-100">
                  {#each counterData.weakAgainst as sub}
                    <div class="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                      <div class="flex items-center gap-3">
                        <img 
                          src={getHeroHead(sub.heroid)} 
                          alt="Sub Hero" 
                          class="w-10 h-10 rounded-xl object-cover border border-gray-200"
                          on:error={(e) => e.target.src = sub.hero?.data?.head || "/logo1.png"}
                        />
                        <div>
                          <p class="text-sm font-extrabold text-gray-800">{getHeroName(sub.heroid)}</p>
                          <p class="text-[11px] font-semibold text-gray-400">Win Rate: {formatPercentage(sub.hero_win_rate)}</p>
                        </div>
                      </div>
                      <span class="text-xs font-bold text-emerald-500 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg">
                        { (sub.increase_win_rate * 100).toFixed(2) }% Win Rate
                      </span>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>

          </div>
        {/if}

        <!-- Render Tab 3 (Synergy) -->
        {#if activeTab === "synergy" && compatibilityData}
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            <!-- Best Partners (Rekan Terbaik) -->
            <div class="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
              <div class="space-y-1">
                <h3 class="text-lg font-black text-[#0a2e52] flex items-center gap-2">
                  Best Partners with {selectedHero.name} (Sinergi Bagus)
                </h3>
                <p class="text-xs font-semibold text-gray-400">Hero rekan tim yang memberikan peningkatan win rate tertinggi saat dimainkan bersama {selectedHero.name}.</p>
              </div>

              {#if compatibilityData.bestPartners.length === 0}
                <p class="text-sm text-gray-500 italic">Data sinergi terbaik tidak tersedia.</p>
              {:else}
                <div class="divide-y divide-gray-100">
                  {#each compatibilityData.bestPartners as sub}
                    <div class="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                      <div class="flex items-center gap-3">
                        <img 
                          src={getHeroHead(sub.heroid)} 
                          alt="Sub Hero" 
                          class="w-10 h-10 rounded-xl object-cover border border-gray-200"
                          on:error={(e) => e.target.src = sub.hero?.data?.head || "/logo1.png"}
                        />
                        <div>
                          <p class="text-sm font-extrabold text-gray-800">{getHeroName(sub.heroid)}</p>
                          <p class="text-[11px] font-semibold text-gray-400">Win Rate Tim: {formatPercentage(sub.hero_win_rate)}</p>
                        </div>
                      </div>
                      <span class="text-xs font-bold text-blue-500 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-lg">
                        +{ (sub.increase_win_rate * 100).toFixed(2) }% Win Rate
                      </span>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>

            <!-- Worst Partners (Rekan Terburuk) -->
            <div class="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
              <div class="space-y-1">
                <h3 class="text-lg font-black text-rose-500 flex items-center gap-2">
                  Avoid Teaming With (Kurang Cocok)
                </h3>
                <p class="text-xs font-semibold text-gray-400">Hero yang menurunkan statistik kemenangan tim apabila dipasangkan dengan {selectedHero.name}.</p>
              </div>

              {#if compatibilityData.worstPartners.length === 0}
                <p class="text-sm text-gray-500 italic">Data tidak tersedia.</p>
              {:else}
                <div class="divide-y divide-gray-100">
                  {#each compatibilityData.worstPartners as sub}
                    <div class="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                      <div class="flex items-center gap-3">
                        <img 
                          src={getHeroHead(sub.heroid)} 
                          alt="Sub Hero" 
                          class="w-10 h-10 rounded-xl object-cover border border-gray-200"
                          on:error={(e) => e.target.src = sub.hero?.data?.head || "/logo1.png"}
                        />
                        <div>
                          <p class="text-sm font-extrabold text-gray-800">{getHeroName(sub.heroid)}</p>
                          <p class="text-[11px] font-semibold text-gray-400">Win Rate Tim: {formatPercentage(sub.hero_win_rate)}</p>
                        </div>
                      </div>
                      <span class="text-xs font-bold text-rose-500 bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-lg">
                        { (sub.increase_win_rate * 100).toFixed(2) }% Win Rate
                      </span>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>

          </div>
        {/if}

      {/if}

    </div>
  {:else if activeTab === "match"}
    <!-- TAB 4: BATTLE MATCH ANALYSIS -->
    <div class="space-y-8 animate-fade-in text-gray-800">
      
      {#if !mlbbJwt}
        <!-- Form Connection (Unauthenticated) -->
        <div class="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 max-w-lg mx-auto shadow-sm space-y-6">
          <div class="space-y-1.5 text-center sm:text-left">
            <h3 class="text-xl font-black text-gray-800 flex items-center gap-2 justify-center sm:justify-start">
              Hubungkan Akun Mobile Legends
            </h3>
            <p class="text-xs font-semibold text-gray-400">
              Untuk mengunduh riwayat pertandingan live secara resmi, silakan kirim kode verifikasi ke inbox akun game Anda.
            </p>
          </div>

          <div class="space-y-4">
            <!-- Game ID Input -->
            <div class="space-y-1.5">
              <span class="text-xs font-extrabold text-gray-500 uppercase tracking-wider block">ID Game (User ID)</span>
              <input 
                type="number"
                bind:value={mlbbRoleid}
                placeholder="Masukkan ID Game Anda (misal: 12345678)"
                class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 outline-none focus:border-[#0a2e52] focus:bg-white transition-all shadow-inner"
              />
            </div>

            <!-- Zone ID Input -->
            <div class="space-y-1.5">
              <span class="text-xs font-extrabold text-gray-500 uppercase tracking-wider block">ID Zona (Server ID)</span>
              <input 
                type="number"
                bind:value={mlbbZoneid}
                placeholder="Masukkan ID Server Anda (misal: 1234)"
                class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 outline-none focus:border-[#0a2e52] focus:bg-white transition-all shadow-inner"
              />
            </div>

            <!-- Send VC Button -->
            <button 
              on:click={sendVc}
              disabled={loadingSendVc}
              class="w-full py-3.5 text-sm font-bold bg-[#0a2e52] hover:bg-blue-900 text-white rounded-xl shadow-md transition-all active:scale-[0.99] disabled:opacity-50 flex justify-center items-center gap-2 cursor-pointer"
            >
              {#if loadingSendVc}
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Mengirim Kode...
              {:else}
                Kirim Kode Verifikasi ke Game
              {/if}
            </button>

            {#if vcSent}
              <!-- VC Verification Input (Appears only after VC dispatched) -->
              <div class="pt-4 border-t border-gray-100 space-y-4 animate-fade-in">
                <div class="space-y-1.5">
                  <span class="text-xs font-extrabold text-gray-500 uppercase tracking-wider block">Kode Verifikasi (6 Digit)</span>
                  <input 
                    type="number"
                    bind:value={verificationCode}
                    placeholder="Masukkan 6 digit kode dari in-game mail"
                    class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-center tracking-[0.25em] text-gray-800 outline-none focus:border-[#0a2e52] focus:bg-white transition-all shadow-inner"
                  />
                </div>

                <button 
                  on:click={loginMlbb}
                  disabled={loadingLogin}
                  class="w-full py-3.5 text-sm font-bold bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-md transition-all active:scale-[0.99] disabled:opacity-50 flex justify-center items-center gap-2 cursor-pointer"
                >
                  {#if loadingLogin}
                    <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Memproses Verifikasi...
                  {:else}
                    Verifikasi & Hubungkan Akun
                  {/if}
                </button>
              </div>
            {/if}
          </div>
        </div>
      {:else}
        <!-- Authenticated State (Dashboard & Matches) -->
        <div class="space-y-6">
          
          <!-- Connection Status Card -->
          <div class="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <span class="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
              <div class="space-y-0.5">
                <p class="text-sm font-extrabold text-gray-800">Akun MLBB Terhubung</p>
                <p class="text-xs font-bold text-gray-400">ID Game: {mlbbRoleid} ({mlbbZoneid})</p>
              </div>
            </div>
            <button 
              on:click={disconnectMlbb}
              class="px-4 py-2 text-xs font-extrabold bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 rounded-lg transition-colors cursor-pointer"
            >
              Putuskan Hubungan
            </button>
          </div>

          <!-- Main Layout Column: Match history list left, match detail right -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            <!-- Left Column: Match History List -->
            <div class="lg:col-span-4 space-y-4">
              <div class="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
                <span class="text-xs font-extrabold text-gray-500 uppercase tracking-wider block">Riwayat Pertandingan</span>

                <!-- Season Selector Dropdown -->
                {#if seasonsList.length > 0}
                  <div class="space-y-1.5 pb-2 border-b border-gray-100">
                    <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Pilih Season</span>
                    <div class="relative">
                      <select 
                        bind:value={activeSeasonId}
                        on:change={loadMatchesHistory}
                        class="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 outline-none focus:border-[#0a2e52] transition-colors"
                      >
                        {#each seasonsList as season}
                          <option value={season}>Season {season}</option>
                        {/each}
                      </select>
                      <span class="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-gray-400 pointer-events-none">▼</span>
                    </div>
                  </div>
                {/if}
                
                {#if loadingMatches}
                  <div class="flex flex-col items-center justify-center py-12">
                    <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0a2e52]"></div>
                    <p class="mt-2 text-xs font-bold text-gray-400">Loading history...</p>
                  </div>
                {:else if matchesList.length === 0}
                  <p class="text-sm text-gray-500 italic text-center py-6">Tidak ada data match di season ini.</p>
                {:else}
                  <div class="space-y-3 max-h-[500px] overflow-y-auto pr-1 no-scrollbar">
                    {#each matchesList as match}
                      <button 
                        on:click={() => selectMatchDetail(match.bid_s || match.bid)}
                        class="w-full border rounded-xl p-3 flex items-center justify-between text-left transition-all duration-200 {manualMatchId === (match.bid_s || match.bid) ? 'border-[#0a2e52] bg-blue-50/30' : 'border-gray-100 hover:bg-gray-50'}"
                      >
                        <div class="flex items-center gap-3">
                          <img 
                            src={match.hid_e?.ix} 
                            alt={match.hid_e?.n} 
                            class="w-10 h-10 rounded-lg object-cover border border-gray-100"
                            on:error={(e) => e.target.src = "/logo1.png"}
                          />
                          <div>
                            <p class="text-xs font-extrabold text-gray-800">{match.hid_e?.n || "Unknown"}</p>
                            <p class="text-[10px] font-semibold text-gray-400">{formatPercentage(match.s / 1000)} KDA: {match.k}/{match.d}/{match.a}</p>
                          </div>
                        </div>

                        <div class="text-right">
                          <span class="text-[10px] font-black uppercase px-2 py-0.5 rounded {match.res === 1 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}">
                            {match.res === 1 ? "Win" : "Lose"}
                          </span>
                          {#if match.mvp === 1}
                            <span class="block text-[8px] font-black text-yellow-600 uppercase tracking-widest mt-1">MVP</span>
                          {/if}
                        </div>
                      </button>
                    {/each}
                  </div>
                {/if}
              </div>

              <!-- Manual Match ID Input -->
              <div class="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3">
                <span class="text-xs font-extrabold text-gray-500 uppercase tracking-wider block">Cari Match ID Lain</span>
                <div class="flex gap-2">
                  <input 
                    type="text"
                    bind:value={manualMatchId}
                    placeholder="Masukkan Battle ID..."
                    class="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 outline-none focus:border-[#0a2e52] transition-colors"
                  />
                  <button 
                    on:click={() => selectMatchDetail(manualMatchId)}
                    class="px-4 py-2 text-xs font-bold text-white bg-[#0a2e52] hover:bg-blue-900 rounded-xl shadow transition-colors cursor-pointer"
                  >
                    Cari
                  </button>
                </div>
              </div>
            </div>

            <!-- Right Column: Detailed Scoreboard -->
            <div class="lg:col-span-8">
              {#if loadingMatchDetail}
                <div class="bg-white border border-gray-200 rounded-2xl p-16 shadow-sm flex flex-col items-center justify-center">
                  <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0a2e52]"></div>
                  <p class="mt-4 text-xs font-bold text-gray-400">Loading detail scoreboard...</p>
                </div>
              {:else if !selectedMatch}
                <div class="bg-white border border-gray-200 rounded-2xl p-16 shadow-sm text-center text-gray-400">
                  <p class="font-semibold">Silakan pilih salah satu match di riwayat sebelah kiri, atau masukkan Battle ID manual.</p>
                </div>
              {:else}
                
                <!-- Scoreboard Cards -->
                <div class="space-y-6">
                  
                  <!-- Match Header Info -->
                  <div class="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex justify-between items-center flex-wrap gap-4">
                    <div class="space-y-1">
                      <p class="text-[10px] font-black text-gray-400 uppercase tracking-wider">Battle ID: {manualMatchId}</p>
                      <h4 class="text-base font-extrabold text-gray-800">Detail Pertandingan</h4>
                    </div>
                    <div class="flex gap-4 text-xs font-bold text-gray-500">
                      <div>
                        <span class="text-gray-400">Durasi:</span> {formatDuration(selectedMatch[0]?.bd)}
                      </div>
                      <div>
                        <span class="text-gray-400">Waktu:</span> {formatTimestamp(selectedMatch[0]?.ts)}
                      </div>
                    </div>
                  </div>

                  <!-- Tactical Analysis Card -->
                  {#if matchAnalysis}
                    <div class="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4 border-l-4 border-l-[#0a2e52] animate-fade-in text-gray-800">
                      <div class="flex items-center justify-between">
                        <h5 class="text-xs font-black text-[#0a2e52] uppercase tracking-wider flex items-center gap-1.5">
                          Analisis Pertandingan
                        </h5>
                        <span class="text-[10px] font-extrabold px-2.5 py-1 rounded-lg {matchAnalysis.statusColor}">
                          {matchAnalysis.title}
                        </span>
                      </div>
                      
                      
                      <p class="text-xs text-gray-600 leading-relaxed font-semibold">
                        {matchAnalysis.summaryMessage}
                      </p>

                      {#if matchAnalysis.adviceList.length > 0}
                        <div class="bg-gray-50/50 rounded-xl p-3 border border-gray-100/80 space-y-2">
                           <span class="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Catatan Performa:</span>
                          <ul class="list-disc pl-5 text-[11px] text-gray-600 space-y-1.5 font-bold">
                            {#each matchAnalysis.adviceList as advice}
                              <li>{advice}</li>
                            {/each}
                          </ul>
                        </div>
                      {/if}
                    </div>
                  {/if}

                  <!-- Dynamic Statistics Chart Card -->
                  <div class="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in text-gray-800">
                    
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                      <h3 class="text-base font-extrabold text-gray-800 text-center md:text-left">
                        {#if activeStatsMetric === 'kda'}
                          Grafik: Rasio KDA Pemain
                        {:else if activeStatsMetric === 'damage'}
                          Grafik: Total Damage Dealt Pemain
                        {:else if activeStatsMetric === 'teamfight'}
                          Grafik: Partisipasi Team Fight Pemain
                        {:else if activeStatsMetric === 'score'}
                          Grafik: Skor Performa Pemain
                        {/if}
                      </h3>
                      
                      <!-- Segmented metric buttons -->
                      <div class="flex flex-nowrap overflow-x-auto no-scrollbar bg-gray-100 p-1 rounded-lg border border-gray-200/50 justify-center gap-1 self-center">
                        <button 
                          on:click={() => activeStatsMetric = "kda"}
                          class="px-3.5 py-1.5 text-[10px] font-black rounded-md transition-all {activeStatsMetric === 'kda' ? 'bg-[#0a2e52] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-white/40'}"
                        >
                          Rasio KDA
                        </button>
                        <button 
                          on:click={() => activeStatsMetric = "damage"}
                          class="px-3.5 py-1.5 text-[10px] font-black rounded-md transition-all {activeStatsMetric === 'damage' ? 'bg-[#0a2e52] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-white/40'}"
                        >
                          Damage Dealt
                        </button>
                        <button 
                          on:click={() => activeStatsMetric = "teamfight"}
                          class="px-3.5 py-1.5 text-[10px] font-black rounded-md transition-all {activeStatsMetric === 'teamfight' ? 'bg-[#0a2e52] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-white/40'}"
                        >
                          Team Fight %
                        </button>
                        <button 
                          on:click={() => activeStatsMetric = "score"}
                          class="px-3.5 py-1.5 text-[10px] font-black rounded-md transition-all {activeStatsMetric === 'score' ? 'bg-[#0a2e52] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-white/40'}"
                        >
                          Skor Game
                        </button>
                      </div>
                    </div>
                    
                    <div class="relative w-full max-w-5xl mx-auto overflow-x-auto scrollbar-thin">
                      <svg viewBox="0 0 820 420" class="w-full h-auto overflow-visible">
                        <!-- Grid Lines -->
                        {#each Array(5) as _, j}
                          {@const val = (chartMetricYMax / 4) * j}
                          {@const yLine = 30 + 280 - (val / chartMetricYMax) * 280}
                          <!-- Light gray horizontal guide grid lines -->
                          <line x1="55" y1={yLine} x2="800" y2={yLine} stroke="#e5e7eb" stroke-width="0.8" stroke-dasharray="2,2" />
                          <!-- Left axis tick marks (outward 6px) -->
                          <line x1="55" y1={yLine} x2="49" y2={yLine} stroke="#111827" stroke-width="1.2" />
                          <!-- Left axis tick label text -->
                          <text x="43" y={yLine + 4} text-anchor="end" class="text-[10px] font-black text-gray-800 font-mono fill-gray-800">{formatChartValue(val)}</text>
                        {/each}

                        <!-- matplotlib style complete bounding box box border -->
                        <rect x="55" y="30" width="745" height="280" fill="none" stroke="#111827" stroke-width="1.5" />

                        <!-- Bars & Labels -->
                        {#each chartDataList as p, i}
                          {@const barHeight = (p.value / chartMetricYMax) * 280}
                          {@const xBar = 55 + i * 74 + 16}
                          {@const yBar = 30 + 280 - barHeight}
                          {@const xCenter = xBar + 21}
                          
                          <!-- X-axis tick marks (downward 6px) -->
                          <line x1={xCenter} y1="310" x2={xCenter} y2="316" stroke="#111827" stroke-width="1.2" />

                          <!-- Rect Bar: Solid high-contrast with dark border outline -->
                          <rect 
                            x={xBar} 
                            y={yBar} 
                            width="42" 
                            height={barHeight} 
                            fill={p.team === 1 ? '#3174a1' : '#d03a3a'} 
                            stroke={p.team === 1 ? '#1d4ed8' : '#be123c'} 
                            stroke-width="1"
                            class="transition-all duration-300 hover:opacity-90 cursor-pointer"
                          >
                            <title>{p.name} ({p.hero})&#10;Nilai: {p.value.toLocaleString()}&#10;KDA: {p.k}/{p.d}/{p.a}</title>
                          </rect>

                          <!-- Value Text above bar -->
                          {#if barHeight > 10}
                            <text 
                              x={xCenter} 
                              y={yBar - 6} 
                              text-anchor="middle" 
                              class="text-[9px] font-black text-gray-800 font-mono fill-gray-800"
                            >
                              {formatBarValue(p.value)}
                            </text>
                          {/if}

                          <!-- Rotated X-axis name labels (angled -45 degrees) -->
                          <text 
                            x={xCenter} 
                            y="330" 
                            text-anchor="end" 
                            transform="rotate(-45, {xCenter}, 330)" 
                            class="text-[10px] font-black text-gray-700 font-sans tracking-tight fill-gray-700"
                          >
                            {p.name}
                          </text>
                        {/each}

                        <!-- Axis Titles -->
                        <text x="15" y="170" text-anchor="middle" transform="rotate(-90, 15, 170)" class="text-xs font-black text-gray-800 font-sans tracking-wider fill-gray-800">
                          {#if activeStatsMetric === 'kda'}
                            Rasio KDA
                          {:else if activeStatsMetric === 'damage'}
                            Damage Dealt
                          {:else if activeStatsMetric === 'teamfight'}
                            Team Fight (%)
                          {:else if activeStatsMetric === 'score'}
                            Skor Game
                          {/if}
                        </text>
                      </svg>
                    </div>
                  </div>

                               <!-- Scoreboard Grid: Team 1 vs Team 2 -->
                  <div class="space-y-6">
                    
                    <!-- Loop Team Blue vs Red -->
                    {#each [1, 2] as teamFlag}
                      {@const teamPlayers = selectedMatch.filter(p => p.f === teamFlag)}
                      {@const isWin = teamPlayers[0]?.fw === 1}
                      {@const totalKills = teamPlayers.reduce((sum, p) => sum + p.k, 0)}
                      {@const totalDeaths = teamPlayers.reduce((sum, p) => sum + p.d, 0)}
                      {@const totalAssists = teamPlayers.reduce((sum, p) => sum + p.a, 0)}
                      
                      <div class="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                        
                        <!-- Team Title Bar -->
                        <div class="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2 {teamFlag === 1 ? 'bg-blue-50/20' : 'bg-rose-50/20'}">
                          <div class="flex items-center gap-3">
                            <span class="text-sm font-black tracking-wide {teamFlag === 1 ? 'text-blue-700' : 'text-rose-700'}">
                              TIM {teamFlag === 1 ? 'A (BIRU)' : 'B (MERAH)'}
                            </span>
                            <span class="text-xs font-black px-2 py-0.5 rounded {isWin ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'}">
                              {isWin ? "VICTORY" : "DEFEAT"}
                            </span>
                          </div>

                          <div class="text-xs font-extrabold text-gray-500">
                            Total KDA: <span class="text-gray-800">{totalKills} / {totalDeaths} / {totalAssists}</span>
                          </div>
                        </div>

                        <!-- Team Players Table List -->
                        <div class="divide-y divide-gray-50 overflow-x-auto">
                          {#each teamPlayers as p}
                            <div class="border-b border-gray-50 last:border-0">
                              <!-- Clickable Player Row Header -->
                              <div 
                                on:click={() => toggleAnalysisHero(p)}
                                on:keydown={(e) => (e.key === "Enter" || e.key === " ") && toggleAnalysisHero(p)}
                                role="button"
                                tabindex="0"
                                class="p-4 grid grid-cols-12 gap-4 min-w-[700px] items-center cursor-pointer transition-colors duration-200 focus:outline-none focus:bg-[#f0f5fa] {selectedAnalysisHero?.rname === p.rname ? 'bg-[#f0f5fa] border-l-4 border-l-[#0a2e52] pl-3' : 'hover:bg-gray-50'}"
                              >
                                
                                <!-- Profile, Hero, Name -->
                                <div class="flex items-center gap-3.5 col-span-3">
                                  <div class="relative">
                                    <img 
                                      src={p.hid_e?.ix} 
                                      alt={p.hid_e?.n} 
                                      class="w-11 h-11 rounded-xl object-cover border border-gray-100 shadow-sm"
                                      on:error={(e) => e.target.src = "/logo1.png"}
                                    />
                                    <span class="absolute -bottom-1 -right-1 bg-gray-800 text-white font-black text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white">
                                      {p.hlvl}
                                    </span>
                                  </div>
                                  <div class="space-y-0.5 min-w-0">
                                    <div class="flex items-center gap-1.5">
                                      <p class="text-xs font-extrabold text-gray-800 truncate">{p.rname}</p>
                                      {#if p.mvp === 1}
                                        <span class="text-[8px] font-black px-1.5 py-0.2 rounded bg-yellow-100 text-yellow-800 border border-yellow-200 tracking-wider shrink-0">MVP</span>
                                      {/if}
                                    </div>
                                    <p class="text-[10px] font-bold text-gray-400 truncate">{p.hid_e?.n || "Unknown"}</p>
                                  </div>
                                </div>

                                <!-- KDA & Score -->
                                <div class="col-span-2 text-center space-y-0.5">
                                  <p class="text-xs font-black text-gray-800">{p.k} / {p.d} / {p.a}</p>
                                  <p class="text-[10px] font-extrabold text-gray-400">Score: { (p.s / 100).toFixed(1) }</p>
                                </div>

                                <!-- Damage, Teamfight Contribution -->
                                <div class="col-span-3 space-y-1">
                                  <div class="flex justify-between text-[10px] font-bold">
                                    <span class="text-gray-400">Damage: {p.o.toLocaleString()}</span>
                                    <span class="text-gray-600">{(p.op * 100).toFixed(0)}%</span>
                                  </div>
                                  <div class="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div class="h-full bg-blue-500 rounded-full" style="width: {p.op * 100}%"></div>
                                  </div>
                                  <div class="flex justify-between text-[9px] font-semibold text-gray-400">
                                    <span>Team Fight:</span>
                                    <span>{(p.tfr * 100).toFixed(0)}%</span>
                                  </div>
                                </div>

                                <!-- Gear items built -->
                                <div class="flex items-center gap-1 col-span-4 justify-end">
                                  {#each p.its_e as item}
                                    {#if item && item.ix}
                                      <img 
                                        src={item.ix} 
                                        alt={item.n} 
                                        title={item.n}
                                        class="w-7 h-7 rounded bg-gray-50 border border-gray-100 object-cover"
                                      />
                                    {:else}
                                      <div class="w-7 h-7 bg-gray-100/50 border border-gray-200 border-dashed rounded"></div>
                                    {/if}
                                  {/each}
                                  <!-- Accordion Chevron Arrow -->
                                  <div class="ml-2 text-gray-400 shrink-0">
                                    {#if selectedAnalysisHero?.rname === p.rname}
                                      <svg class="w-4 h-4 text-[#0a2e52]" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" />
                                      </svg>
                                    {:else}
                                      <svg class="w-4 h-4 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                                      </svg>
                                    {/if}
                                  </div>
                                </div>

                              </div>

                              <!-- Expandable Recommendation Drawer -->
                              {#if selectedAnalysisHero && selectedAnalysisHero.rname === p.rname}
                                <div class="px-5 py-4 bg-[#f8fafc] border-t border-gray-100 flex flex-col gap-4 animate-fade-in min-w-[700px]">
                                  <div class="flex items-center justify-between border-b border-gray-200/50 pb-2">
                                    <span class="text-xs font-extrabold text-[#0a2e52] uppercase tracking-wider block">
                                      Analisis & Tips Menghadapi Hero: {p.hid_e?.n || 'Hero'} ({p.rname})
                                    </span>
                                    {#if loadingAnalysisHeroCounters}
                                      <div class="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-[#0a2e52]"></div>
                                    {/if}
                                  </div>

                                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <!-- Counter Pick List (Better Pick) -->
                                    <div class="space-y-2.5">
                                      <span class="text-[10px] font-black text-gray-500 uppercase tracking-wider block">Better Pick (Hero Counter)</span>
                                      {#if analysisHeroCounters.length > 0}
                                        <div class="grid grid-cols-3 gap-3">
                                          {#each analysisHeroCounters as counter}
                                            <div class="bg-white border border-gray-200 rounded-xl p-3 flex flex-col items-center text-center space-y-1.5 shadow-md hover:scale-[1.02] transition-transform duration-200">
                                              <img 
                                                src={counter.head} 
                                                alt={counter.name}
                                                class="w-14 h-14 rounded-xl object-cover border border-gray-200 shadow-md"
                                                on:error={(e) => e.target.src = "/logo1.png"}
                                              />
                                              <span class="text-[10px] font-bold text-gray-855 truncate w-full">{counter.name}</span>
                                              <span class="text-[8px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                                                +{ (counter.increase * 100).toFixed(1) }% WR
                                              </span>
                                            </div>
                                          {/each}
                                        </div>
                                      {:else if !loadingAnalysisHeroCounters}
                                        <p class="text-xs text-gray-400 italic font-semibold">Data hero counter tidak tersedia.</p>
                                      {/if}
                                    </div>

                                    <!-- Defense Item Advice -->
                                     <div class="space-y-2.5">
                                       <span class="text-[10px] font-black text-amber-800 uppercase tracking-wider block">Rekomendasi Build Item Defense</span>
                                       {#if analysisHeroRecommendedItems.length > 0}
                                         <div class="grid grid-cols-3 gap-2">
                                           {#each analysisHeroRecommendedItems as item}
                                             <div class="bg-white border border-gray-200 rounded-xl p-3 flex flex-col items-center text-center space-y-2 shadow-md hover:scale-[1.02] transition-transform duration-200">
                                               <img 
                                                 src={getItemImage(item.name)} 
                                                 alt={item.name}
                                                 class="w-14 h-14 rounded-xl object-cover bg-gray-50 border border-gray-200 shadow-md"
                                                 on:error={(e) => e.target.src = "/logo1.png"}
                                               />
                                               <span class="text-[10px] font-black text-gray-855 tracking-tight leading-tight block truncate w-full">{item.name}</span>
                                               <span class="text-[8px] font-bold text-gray-400 block leading-tight">{item.desc}</span>
                                             </div>
                                           {/each}
                                         </div>
                                       {:else}
                                         <p class="text-xs text-gray-400 italic font-semibold">Rekomendasi item tidak tersedia.</p>
                                       {/if}
                                     </div>            
                                  </div>
                                </div>
                              {/if}

                            </div>
                          {/each}
                        </div>

                      </div>
                    {/each}

                  </div>      </div>

              {/if}
            </div>

          </div>
          
        </div>
      {/if}

    </div>
  {/if}

</div>

<style>
  /* Custom scroll style helper */
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  /* Fade-in keyframe animations for better UX */
  .animate-fade-in {
    animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(6px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
