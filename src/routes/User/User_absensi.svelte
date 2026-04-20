<script>
  import { push } from "svelte-spa-router";
  import { onMount } from "svelte";
  import Swal from "sweetalert2";


  let currentUserName = "Loading...";
  
  let activeTab = "tersedia";


  let aktivitasTersedia = [
    { id: 1, judul: "[Week 1] - Lorem Ipsum Dolor Sit Amet" },
    { id: 2, judul: "[Week 2] - Latihan Taktik Dasar" },
    { id: 3, judul: "[Week 3] - Evaluasi Scrimmage" },
    { id: 4, judul: "[Week 4] - Persiapan Turnamen" }
  ];

  let aktivitasSelesai = [
    { id: 0, judul: "[Week 0] - Sosialisasi Anggota Baru" }
  ];

  onMount(() => {
    const name = localStorage.getItem("user_name") || "User";
    currentUserName = name;
  });
  let isAbsenModalOpen = false;
  let selectedAktivitas = null;

  let formAbsen = {
    pelajaran: "",
    bukti: null, 
    mood: ""     
  };

  function openAbsenModal(aktivitas) {
    selectedAktivitas = aktivitas;
    formAbsen = { pelajaran: "", bukti: null, mood: "" };
    isAbsenModalOpen = true;
  }

  function closeAbsenModal() {
    isAbsenModalOpen = false;
    selectedAktivitas = null;
  }

  function setMood(pilihan) {
    formAbsen.mood = pilihan;
  }

  function submitAbsen() {
    if (!formAbsen.pelajaran || !formAbsen.mood) {
      Swal.fire({ icon: "warning", title: "Data Belum Lengkap", text: "Pastikan semua  telah diisi!" });
      return;
    }

    // let formData = new FormData();
    // formData.append('user_id', currentUserId);
    // formData.append('aktivitas_id', selectedAktivitas.id);
    // formData.append('pelajaran', formAbsen.pelajaran);
    // formData.append('mood', formAbsen.mood);
    // formData.append('bukti', formAbsen.bukti); // (File dari input type="file")
    // fetch('/api/absen', { method: 'POST', body: formData })

    Swal.fire({
      icon: "success",
      title: "Berhasil!",
      text: "Absen kamu telah terkirim. Terima kasih!",
      timer: 2000,
      showConfirmButton: false
    });
    
    aktivitasTersedia = aktivitasTersedia.filter(a => a.id !== selectedAktivitas.id);
    aktivitasSelesai = [selectedAktivitas, ...aktivitasSelesai];
    
    closeAbsenModal();
  }

  function handleLogout() {
    Swal.fire({
      title: "Yakin ingin keluar?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#9ca3af",
      confirmButtonText: "Ya, Logout!",
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem("user_name");
        localStorage.removeItem("user_role");
        push("/SignIn");
      }
    });
  }

  // --- LOGIC LAYOUT ---
  let innerWidth = 0;
  let isSidebarOpen = true;

  $: if (innerWidth > 0 && innerWidth < 768) {
    isSidebarOpen = false;
  } else if (innerWidth >= 768) {
    isSidebarOpen = true;
  }

  function toggleSidebar() {
    isSidebarOpen = !isSidebarOpen;
  }

  let isDropdownOpen = false;
  function toggleDropdown() { isDropdownOpen = !isDropdownOpen; }
  function closeDropdown() { isDropdownOpen = false; }
</script>

<svelte:window bind:innerWidth />

<div class="flex h-screen overflow-hidden font-sans bg-gray-50">
  
  {#if isSidebarOpen && innerWidth < 768}
    <div on:click={toggleSidebar} class="fixed inset-0 z-40 transition-opacity bg-black/50 backdrop-blur-sm" aria-hidden="true"></div>
  {/if}

  <aside
    class="{isSidebarOpen ? 'w-64' : 'w-0'} absolute md:relative z-50 overflow-hidden bg-[#0a2e52] text-white flex flex-col h-full shrink-0 shadow-xl transition-all duration-300 whitespace-nowrap"
  >
    <div class="flex items-center justify-between px-6 py-8">
      <div class="flex items-center gap-3">
        <img src="src/assets/logo1.png" alt="logo" class="w-10 h-12 text-white" />
        <span class="text-2xl font-bold tracking-wider">E-Sport</span>
      </div>

      <button
        on:click={toggleSidebar}
        class="p-1 transition-colors rounded-md cursor-pointer md:hidden bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white"
      >
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <nav class="flex-1 px-4 space-y-6 overflow-y-auto">

        <div class="flex flex-col gap-1">
          <button on:click={() => {
                window.location.href = '#/user_absensi';
              }} class="flex items-center w-full gap-3 px-4 py-2.5 text-sm font-medium text-white transition-colors rounded-lg bg-white/10">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              Dashboard
            </button>
          <button
            on:click={() => {
              window.location.href = "#/user_kegiatan";
            }}
            class="flex items-center w-full gap-3 px-4 py-2.5 text-sm transition-colors rounded-lg text-gray-300 hover:bg-white/5 hover:text-white">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            Kegiatan
          </button>
          <button
            on:click={() => {
              window.location.href = "#/user_analisis";
            }}
            class="flex items-center w-full gap-3 px-4 py-2.5 text-sm transition-colors rounded-lg text-gray-300 hover:bg-white/5 hover:text-white">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
            Analisis
          </button>
        </div>
      
      <div class="p-5">
        <button
          on:click={handleLogout}
          class="flex items-center justify-center w-full py-2.5 text-sm font-semibold text-white transition-colors bg-red-600 rounded-lg shadow-md hover:bg-red-700"
        >
          Logout
        </button>
      </div>
    </nav>
  </aside>

  <div class="flex flex-col flex-1 h-full overflow-hidden">
    <header class="flex items-center justify-between h-16 px-8 transition-all duration-300 bg-white border-b border-gray-200 shadow-sm shrink-0 z-10">
      <div class="flex items-center gap-3 text-gray-600">
        <button
          on:click={toggleSidebar}
          class="flex items-center justify-center p-1.5 transition-colors rounded-md cursor-pointer hover:bg-gray-100 text-gray-800"
        >
          {#if isSidebarOpen}
            <svg class="w-5 h-5" stroke-width="2" viewBox="0 0 48 48">
              <path fill="none" stroke="#000000" stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M7.95 11.95h32m-32 12h32m-32 12h32" />
            </svg>
          {:else}
            <svg class="w-5 h-5" stroke-width="2" viewBox="0 0 48 48">
              <path fill="none" stroke="#000000" stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M7.95 11.95h32m-32 12h32m-32 12h32" />
            </svg>
          {/if}
        </button>
        <h1 class="hidden text-base font-bold text-gray-700 md:block">Dashboard</h1>
      </div>

      <div class="relative">
        <button
          on:click={toggleDropdown}
          class="flex items-center gap-2 px-2 py-1 transition-colors rounded-md cursor-pointer md:gap-3 hover:bg-gray-50 focus:outline-none"
        >
          <img src="src/assets/profile.svg" alt="{currentUserName}" class="w-11 h-11 rounded-full" />
          <span class="text-sm font-bold text-gray-700">{currentUserName}</span>
          <svg
            class="w-4 h-4 text-gray-400 transition-transform duration-200 {isDropdownOpen ? 'rotate-180' : ''}"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {#if isDropdownOpen}
          <div class="fixed inset-0 z-40" on:click={closeDropdown} aria-hidden="true"></div>

          <div class="absolute right-0 z-50 w-48 py-2 mt-2 bg-white border border-gray-100 rounded-lg shadow-lg animate-fade-in-down">
            <button
              on:click={() => {
                window.location.href = '#/settingsuser';
                closeDropdown();
              }}
              class="flex items-center w-full gap-2 px-4 py-2.5 text-sm text-gray-700 transition-colors text-left hover:bg-gray-50"
            >
            <img class="w-4 h-4 text-gray-500" src="src/assets/setting.svg" alt="Settings Icon" />
              Settings
            </button>

            <div class="w-full h-px my-1 bg-gray-100"></div>

            <button
              on:click={handleLogout}
              class="flex items-center w-full gap-2 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors text-left hover:bg-red-50"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        {/if}
      </div>
    </header>

    <main class="flex-1 p-6 overflow-x-hidden overflow-y-auto md:p-10 bg-[#fbfcfd]">
      <div class="max-w-5xl mx-auto space-y-8">
        
        <h1 class="text-4xl font-black tracking-tight text-gray-800 md:text-5xl">
          Welcome, {currentUserName}
        </h1>

        <div class="flex gap-4 border-b border-gray-200">
          <button 
            on:click={() => activeTab = 'tersedia'}
            class="px-6 py-3 text-sm font-bold transition-all duration-200 border-b-2 {activeTab === 'tersedia' ? 'border-[#0a2e52] text-[#0a2e52]' : 'border-transparent text-gray-500 hover:text-gray-700'}"
          >
            Aktivitas Tersedia
          </button>
          <button 
            on:click={() => activeTab = 'selesai'}
            class="px-6 py-3 text-sm font-bold transition-all duration-200 border-b-2 {activeTab === 'selesai' ? 'border-[#0a2e52] text-[#0a2e52]' : 'border-transparent text-gray-500 hover:text-gray-700'}"
          >
            Aktivitas Yang Sudah Selesai
          </button>
        </div>

        <div class="overflow-hidden bg-white border border-gray-200 rounded-xl shadow-sm">
          {#if activeTab === 'tersedia'}
            <div class="flex flex-col">
              {#each aktivitasTersedia as item, index}
                <div class="flex items-center justify-between p-5 {index !== aktivitasTersedia.length - 1 ? 'border-b border-gray-100' : ''} hover:bg-gray-50 transition-colors">
                  <span class="text-[15px] font-semibold text-gray-700">{item.judul}</span>
                  
                  <button 
                    on:click={() => openAbsenModal(item)}
                    class="px-8 py-2.5 text-sm font-bold text-white bg-[#0a2e52] rounded-md hover:bg-blue-900 transition-colors shadow-sm"
                  >
                    Absensi
                  </button>
                </div>
              {:else}
                <div class="p-8 font-medium text-center text-gray-500">Hore! Tidak ada aktivitas yang tertunda.</div>
              {/each}
            </div>
          {:else}
            <div class="flex flex-col">
              {#each aktivitasSelesai as item, index}
                <div class="flex items-center justify-between p-5 {index !== aktivitasSelesai.length - 1 ? 'border-b border-gray-100' : ''} bg-gray-50/50">
                  <span class="text-[15px] font-semibold text-gray-500 line-through">{item.judul}</span>
                  <span class="px-6 py-2 text-sm font-bold text-[#0a2e52] bg-blue-100 border border-[#0a2e52] rounded-md shadow-sm">
                    Absensi
                  </span>
                </div>
              {:else}
                <div class="p-8 font-medium text-center text-gray-500">Belum ada aktivitas yang diselesaikan.</div>
              {/each}
            </div>
          {/if}
        </div>

        <div class="grid grid-cols-1 gap-6 mt-10 md:grid-cols-2">
          <div class="flex flex-col items-center justify-center p-8 transition-shadow bg-white border border-gray-200 shadow-sm rounded-2xl hover:shadow-md">
            <div class="flex items-center justify-center w-14 h-14 bg-[#0a2e52] rounded-xl text-white mb-6 shadow-sm">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
            </div>
            <h3 class="text-[15px] font-bold text-gray-700 mb-6">Analisis Match Kamu</h3>
            <button class="flex items-center justify-center w-10 h-10 bg-[#0a2e52] text-white rounded-full hover:bg-blue-900 transition-colors shadow-sm">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
          <div class="flex flex-col items-center justify-center p-8 transition-shadow bg-white border border-gray-200 shadow-sm rounded-2xl hover:shadow-md">
            <div class="flex items-center justify-center w-14 h-14 bg-[#0a2e52] rounded-xl text-white mb-6 shadow-sm">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            </div>
            <h3 class="text-[15px] font-bold text-gray-700 mb-6">Cek Kegiatan</h3>
            <button class="flex items-center justify-center w-10 h-10 bg-[#0a2e52] text-white rounded-full hover:bg-blue-900 transition-colors shadow-sm">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>

      </div>
    </main>
  </div>
</div>

{#if isAbsenModalOpen && selectedAktivitas}
  <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 w-screen h-screen animate-fade-in">
    
    <div class="absolute inset-0 cursor-pointer bg-black/60 backdrop-blur-sm" on:click={closeAbsenModal} aria-hidden="true"></div>

    <div class="relative flex flex-col w-full max-w-2xl bg-white shadow-2xl rounded-2xl max-h-[95vh] overflow-y-auto no-scrollbar">
      
      <div class="flex items-start justify-between p-8 border-b border-gray-100">
        <div>
          <h2 class="text-xl font-black text-gray-800 mb-1">{selectedAktivitas.judul}</h2>
          <p class="text-sm font-medium text-gray-500">{selectedAktivitas.waktu}</p>
        </div>
        <button on:click={closeAbsenModal} class="flex items-center justify-center flex-shrink-0 w-8 h-8 text-white transition-colors bg-[#0a2e52] hover:bg-red-600 rounded-md shadow-sm">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div class="p-8 space-y-8">
        
        <div class="space-y-2">
          <label class="text-sm font-extrabold text-gray-800">
            Apa yang kamu pelajari? <span class="text-red-500">*</span>
          </label>
          <textarea 
            bind:value={formAbsen.pelajaran}
            rows="4" 
            placeholder="Apa yang kamu dapat dari kegiatan ini..."
            class="w-full p-4 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a2e52]/30 focus:border-[#0a2e52] shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] resize-none"
          ></textarea>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-extrabold text-gray-800">
            Bukti <span class="text-red-500">*</span>
          </label>
          <div class="flex flex-col items-center justify-center p-10 bg-[#fafafa] border border-gray-300 rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
            <div class="flex items-center justify-center w-10 h-10 mb-3 text-white bg-black rounded-lg shadow-sm">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            </div>
            <p class="mb-4 text-xs font-medium text-gray-500">Drag foto atau klik tombol di bawah</p>
            
            <button class="px-8 py-2 text-sm font-bold text-white transition-colors bg-[#0a2e52] rounded-lg shadow-sm hover:bg-blue-900">
              Upload
            </button>
          </div>
        </div>

        <div class="space-y-3">
          <label class="text-sm font-extrabold text-gray-800">
            Mood anda hari ini? <span class="text-red-500">*</span>
          </label>
          <div class="flex gap-4">
            <button 
              on:click={() => setMood('happy')}
              class="text-5xl transition-transform transform hover:scale-110 focus:outline-none {formAbsen.mood === 'happy' ? 'scale-110 drop-shadow-md grayscale-0' : 'grayscale opacity-70 hover:grayscale-0 hover:opacity-100'}"
            >
              😊
            </button>
            <button 
              on:click={() => setMood('sad')}
              class="text-5xl transition-transform transform hover:scale-110 focus:outline-none {formAbsen.mood === 'sad' ? 'scale-110 drop-shadow-md grayscale-0' : 'grayscale opacity-70 hover:grayscale-0 hover:opacity-100'}"
            >
              😔
            </button>
            <button 
              on:click={() => setMood('neutral')}
              class="text-5xl transition-transform transform hover:scale-110 focus:outline-none {formAbsen.mood === 'neutral' ? 'scale-110 drop-shadow-md grayscale-0' : 'grayscale opacity-70 hover:grayscale-0 hover:opacity-100'}"
            >
              😐
            </button>
          </div>
        </div>

      </div>

      <div class="flex justify-end p-8 pt-0">
        <button on:click={submitAbsen} class="px-10 py-3 font-bold text-white transition-colors bg-[#0a2e52] rounded-xl shadow-md hover:bg-blue-900">
          Kirim
        </button>
      </div>

    </div>
  </div>
{/if}