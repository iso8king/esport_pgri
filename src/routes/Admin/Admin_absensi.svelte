<script>
  import { push } from "svelte-spa-router";
  import { onMount } from "svelte";
  import Swal from "sweetalert2";

  let currentUserName = "Loading...";

  // State untuk data dari backend
  let jadwalAbsen = [];
  let isLoading = true;
  let totalUserDiDatabase = 0;

  // State untuk modal
  let isAddJadwalModalOpen = false;
  let selectedJadwal = null;
  let isLihatModalOpen = false;
  let selectedSiswaDetail = null;

  let formJadwal = {
    judul: "",
    tanggal: "",
    jamMulai: "",
    jamSelesai: ""
  };

  let detailSiswaAbsen = [];

  // Fungsi untuk mengambil data kegiatan dari backend
  async function fetchKegiatanData() {
    isLoading = true;
    try {
      const response = await fetch('http://localhost:9999/api/kegiatan/', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Response kegiatan:', result);
        
        const kegiatanData = result.data?.data || [];
        
        jadwalAbsen = kegiatanData.map(item => ({
          id: item.id,
          judul: item.nama_kegiatan,
          tanggal: formatDateIndonesian(item.tanggal_kegiatan),
          waktu: item.jam,
          totalHadir: 0,
          statusTanggal: getStatusTanggal(item.tanggal_kegiatan),
          statusWaktu: getStatusWaktu(item.jam),
          isDisabled: false
        }));
        
        console.log('JadwalAbsen setelah transformasi:', jadwalAbsen);
      } else {
        console.error('Gagal fetch data:', response.status);
        jadwalAbsen = [];
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      jadwalAbsen = [];
    } finally {
      isLoading = false;
    }
  }

  // Fungsi untuk mengambil total user dari database
  async function fetchTotalUser() {
    try {
      const response = await fetch('http://localhost:9999/api/user/count', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        totalUserDiDatabase = result.data?.total || 0;
      }
    } catch (error) {
      console.error('Error fetching total user:', error);
      totalUserDiDatabase = 0;
    }
  }

  // Fungsi untuk mengambil detail absen berdasarkan kegiatan
  async function fetchDetailAbsen(kegiatanId) {
    try {
      const response = await fetch(`http://localhost:9999/api/absen/${kegiatanId}/get`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Response absen:', result);
        
        // Response struktur: { data: [...] }
        const absensiData = result.data || [];
        
        detailSiswaAbsen = absensiData.map(item => ({
          id: item.id || Math.random(),
          nama: item.user?.nama || "Unknown",
          status: "Sudah Absen", // Karena semua yang ada di response sudah absen
          btnLihatDisabled: false,
          jawaban: {
            moodEmoji: getMoodEmoji(item.mood),
            moodText: item.mood || "Tidak diketahui",
            tanggal: formatDateIndonesian(new Date()),
            pelajaran: item.deskripsi || "-",
            bukti: item.bukti || null
          }
        }));
        
        // Update total hadir
        const totalHadir = absensiData.length;
        const jadwalIndex = jadwalAbsen.findIndex(j => j.id === kegiatanId);
        if (jadwalIndex !== -1) {
          jadwalAbsen[jadwalIndex].totalHadir = totalHadir;
          jadwalAbsen = [...jadwalAbsen];
        }
      } else {
        console.error('Gagal fetch detail absen:', response.status);
        detailSiswaAbsen = [];
      }
    } catch (error) {
      console.error('Error fetching detail absen:', error);
      detailSiswaAbsen = [];
    }
  }

  // Helper untuk konversi mood ke emoji
  function getMoodEmoji(mood) {
    const moodMap = {
      'baik': '😊',
      'biasa': '😐',
      'senang': '😄',
      'sedih': '😢',
      'marah': '😠',
      'Good': '😊',
      'Neutral': '😐',
      'Bad': '😢'
    };
    return moodMap[mood?.toLowerCase()] || '😊';
  }

  function formatDateIndonesian(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${day} ${month} ${year}`;
  }

  function getStatusTanggal(dateString) {
    if (!dateString) return "-";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const kegiatanDate = new Date(dateString);
    kegiatanDate.setHours(0, 0, 0, 0);
    
    if (kegiatanDate < today) {
      return "Terlewat";
    } else if (kegiatanDate.getTime() === today.getTime()) {
      return "Hari Ini";
    } else {
      return "Mendatang";
    }
  }

  function getStatusWaktu(waktuString) {
    if (!waktuString) return "-";
    const now = new Date();
    
    let endTime = "";
    if (waktuString.includes("-")) {
      endTime = waktuString.split("-")[1].trim();
    } else if (waktuString.includes(":")) {
      endTime = waktuString;
    }
    
    if (endTime) {
      const [endHour, endMinute] = endTime.split(/[:.]/).map(Number);
      const endDate = new Date();
      endDate.setHours(endHour, endMinute || 0, 0, 0);
      
      if (now > endDate) {
        return "Terlewat";
      } else {
        return "Belum Dimulai";
      }
    }
    return "-";
  }

  $: jadwalTerbaru = jadwalAbsen.length > 0 ? jadwalAbsen[jadwalAbsen.length - 1] : { totalHadir: 0 };
  $: statistikAbsen = {
    sudahAbsen: jadwalTerbaru.totalHadir || 0,
    belumAbsen: totalUserDiDatabase - (jadwalTerbaru.totalHadir || 0)
  };

  function openAddJadwalModal() {
    formJadwal = { judul: "", tanggal: "", jamMulai: "", jamSelesai: "" };
    isAddJadwalModalOpen = true;
  }

  function closeAddJadwalModal() {
    isAddJadwalModalOpen = false;
  }

  async function submitJadwalAbsen() {
    if (!formJadwal.judul || !formJadwal.tanggal || !formJadwal.jamMulai || !formJadwal.jamSelesai) {
      Swal.fire({ icon: "warning", title: "Data Belum Lengkap", text: "Pastikan semua kolom telah diisi!" });
      return;
    }

    const payload = {
      nama_kegiatan: formJadwal.judul,
      tanggal_kegiatan: formJadwal.tanggal,
      jam: `${formJadwal.jamMulai} - ${formJadwal.jamSelesai}`,
      onlyTeam: false
    };

    try {
      Swal.fire({
        title: "Menyimpan data...",
        text: "Mohon tunggu sebentar",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      const response = await fetch(`http://localhost:9999/api/kegiatan/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.status !== 200) {
        throw new Error(result.message || "Gagal menyimpan data");
      }

      Swal.fire({
        icon: "success",
        title: "Jadwal Dibuat!",
        text: "Absen baru telah berhasil dipublikasikan.",
        timer: 1500,
        showConfirmButton: false
      });

      closeAddJadwalModal();
      await fetchKegiatanData();
      
    } catch (error) {
      console.error('Error:', error);
      Swal.fire({ 
        icon: "error", 
        title: "Gagal menyimpan jadwal!", 
        text: error.message,
        confirmButtonColor: "#0a4682" 
      });
    }
  }

  function bukaDetailAbsen(jadwal) {
    selectedJadwal = jadwal;
    fetchDetailAbsen(jadwal.id);
  }

  function tutupDetailAbsen() {
    selectedJadwal = null;
    detailSiswaAbsen = [];
  }

  function openLihatModal(siswa) {
    selectedSiswaDetail = siswa;
    isLihatModalOpen = true;
  }

  function closeLihatModal() {
    isLihatModalOpen = false;
    selectedSiswaDetail = null;
  }

  onMount(() => {
    const name = localStorage.getItem("user_name");
    if (name) {
      currentUserName = name;
    } else {
      push("/");
    }

    if (localStorage.getItem("role") !== "admin") {
      Swal.fire({
        icon: 'error',
        title: 'Unauthorized',
        text: 'Redirecting......',
        confirmButtonColor: '#0b5ba2'
      }).then(() => {
        push('/user/absensi');
      });
    }

    const userStatus = localStorage.getItem("status");
    if (!userStatus) {
      Swal.fire({
        icon: 'warning',
        title: 'Belum Verifikasi',
        text: 'Redirecting......',
        confirmButtonColor: '#0b5ba2'
      }).then(() => {
        push('/verification');
      });
      return;
    }

    fetchKegiatanData();
    fetchTotalUser();
  });

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
        push("/");
      }
    });
  }

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

  function toggleDropdown() {
    isDropdownOpen = !isDropdownOpen;
  }

  function closeDropdown() {
    isDropdownOpen = false;
  }


</script>

<!-- HTML sama persis dengan kode Anda, tidak perlu diubah -->
<svelte:window bind:innerWidth />

<div class="flex h-screen overflow-hidden font-sans bg-gray-50">
  
  {#if isSidebarOpen && innerWidth < 768}
    <div
      on:click={toggleSidebar}
      class="fixed inset-0 z-40 transition-opacity bg-black/50 backdrop-blur-sm"
      aria-hidden="true"
    ></div>
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
      <div>
        <p class="flex items-center gap-2 px-2 mb-2 text-xs font-semibold tracking-wider text-gray-400 uppercase">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Dashboard
        </p>
        <button on:click={() => {
                window.location.href = '#/admin/beranda';
              }} 
        class="flex items-center w-full gap-3 px-4 py-2.5 text-sm transition-colors rounded-lg text-gray-300 hover:bg-white/5 hover:text-white">
          Beranda
        </button>
      </div>

      <div>
        <p class="flex items-center gap-2 px-2 mb-2 text-xs font-semibold tracking-wider text-gray-400 uppercase">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          Management
        </p>
        <div class="flex flex-col gap-1">
          <button on:click={() => {
                window.location.href = '#/admin/anggota';
              }} class="flex items-center w-full gap-3 px-4 py-2.5 text-sm transition-colors rounded-lg text-gray-300 hover:bg-white/5 hover:text-white">
              Anggota
            </button>
          <button
            on:click={() => {
              window.location.href = "#/admin/absensi";
            }}
            class="flex items-center w-full gap-3 px-4 py-2.5 text-sm font-medium text-white transition-colors rounded-lg bg-white/10"
          >
            Absensi
          </button>
          <button
            on:click={() => {
              window.location.href = "#/admin/analisis";
            }}
            class="flex items-center w-full gap-3 px-4 py-2.5 text-sm transition-colors rounded-lg text-gray-300 hover:bg-white/5 hover:text-white"
          >
            Analisis
          </button>
          <button
            on:click={() => {
              window.location.href = "#/admin/jadwal";
            }}
            class="flex items-center w-full gap-3 px-4 py-2.5 text-sm transition-colors rounded-lg text-gray-300 hover:bg-white/5 hover:text-white"
          >
            Jadwal
          </button>
        </div>
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
        <h1 class="hidden text-base font-bold text-gray-700 md:block">Absensi</h1>
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
                window.location.href = "#/admin/settings";
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

    <main class="flex-1 p-10 overflow-x-hidden overflow-y-auto bg-gray-50">
      <div class="max-w-4xl mx-auto space-y-10">
        
        {#if selectedJadwal === null}
          {#if isLoading}
            <div class="flex justify-center items-center p-8">
              <div class="text-center">
                <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#0a4682]"></div>
                <p class="mt-2 text-gray-500">Memuat data...</p>
              </div>
            </div>
          {:else}
            <div class="flex flex-col items-center justify-center gap-6 sm:flex-row">
              <div class="flex items-center w-full sm:w-[320px] p-6 space-x-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
                <div class="flex items-center justify-center w-16 h-16 text-white bg-[#4ade80] rounded-full shadow-lg shadow-green-200">
                  <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
                <div>
                  <h2 class="text-4xl font-black text-gray-800">{statistikAbsen.sudahAbsen}</h2>
                  <p class="text-sm font-medium text-gray-500">Sudah Absen</p>
                </div>
              </div>
              <div class="flex items-center w-full sm:w-[320px] p-6 space-x-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
                <div class="flex items-center justify-center w-16 h-16 text-white bg-[#f87171] rounded-full shadow-lg shadow-red-200">
                  <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
                <div>
                  <h2 class="text-4xl font-black text-gray-800">{statistikAbsen.belumAbsen}</h2>
                  <p class="text-sm font-medium text-gray-500">Belum Absen</p>
                </div>
              </div>
            </div>

            <div class="p-8 bg-white border border-gray-100 shadow-sm rounded-2xl">
              <div class="flex items-center justify-between pb-5 mb-8 border-b border-gray-100">
                <h3 class="text-xl font-bold text-gray-800">Daftar Jadwal Absen</h3>
              
              </div>
              
              <div class="space-y-12">
                {#each jadwalAbsen as jadwal}
                  <div class="flex flex-col gap-6">
                    <div class="flex items-start justify-between">
                      <div class="space-y-3">
                        <h4 class="text-lg font-extrabold text-gray-800">{jadwal.judul}</h4>
                        <div class="pl-6 space-y-1.5 text-sm font-medium text-gray-600">
                          <p>• {jadwal.tanggal}</p>
                          <p>• {jadwal.waktu}</p>
                        </div>
                      </div>
                      <div class="text-right space-y-3 min-w-[120px]">
                        <h4 class="text-lg font-extrabold text-gray-800">Status</h4>
                        <div class="space-y-1.5 text-sm font-medium text-gray-600">
                          <p class="font-bold {jadwal.totalHadir > 0 ? 'text-green-600' : 'text-gray-400'}">
                            {jadwal.totalHadir > 0 ? `${jadwal.totalHadir}/${totalUserDiDatabase}` : '-'}
                          </p>
                          <p>{jadwal.statusTanggal}</p>
                          <!-- <p>{jadwal.statusWaktu}</p> -->
                        </div>
                      </div>
                    </div>

                    <button 
                      on:click={() => bukaDetailAbsen(jadwal)}
                      class="w-full py-3.5 text-sm font-bold rounded-xl transition-colors bg-[#0a2e52] text-white shadow-md hover:bg-blue-900 cursor-pointer"
                    >
                      Cek Absen
                    </button>
                    
                    {#if jadwal !== jadwalAbsen[jadwalAbsen.length - 1]}
                      <hr class="mt-6 border-gray-100" />
                    {/if}
                  </div>
                {:else}
                  <p class="text-center text-gray-500">Belum ada jadwal absen dibuat.</p>
                {/each}
              </div>
            </div>
          {/if}

        {:else}
          <div class="space-y-6 animate-fade-in">
            <button on:click={tutupDetailAbsen} class="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-600 transition-colors bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Kembali
            </button>

            <div>
              <h2 class="text-2xl font-black text-gray-800">{selectedJadwal.judul}</h2>
              <p class="mt-2 text-sm font-medium text-gray-500">
                {selectedJadwal.tanggal} • {selectedJadwal.waktu}
              </p>
            </div>

            <div class="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-2xl">
              <div class="px-6 py-5 border-b border-gray-100">
                <h3 class="text-lg font-bold text-gray-800">Status Absen</h3>
              </div>

              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                  <thead class="bg-white border-b border-gray-100">
                    <tr class="text-sm font-semibold text-gray-600">
                      <th class="px-6 py-4">Nama</th>
                      <th class="px-6 py-4 text-center">Lihat Absen</th>
                    </tr>
                  </thead>
                  <tbody class="text-sm text-gray-700">
                    {#each detailSiswaAbsen as siswa}
                      <tr class="transition-colors border-b border-gray-50 hover:bg-gray-50/50">
                        <td class="px-6 py-4 font-medium text-gray-900">{siswa.nama}</td>
                        <td class="px-6 py-4 text-center">
                          <button 
                            on:click={() => openLihatModal(siswa)} 
                            class="px-5 py-1.5 text-xs font-bold rounded-lg transition-colors bg-[#0a2e52] text-white hover:bg-blue-900 shadow-sm"
                          >
                            Lihat
                          </button>
                        </td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        {/if}

      </div>
    </main>
  </div>
</div>


{#if isLihatModalOpen && selectedSiswaDetail && selectedJadwal}
  <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 w-screen h-screen animate-fade-in">
    <div class="absolute inset-0 cursor-pointer bg-black/60 backdrop-blur-sm" on:click={closeLihatModal} aria-hidden="true"></div>
    <div class="relative flex flex-col w-full max-w-xl bg-white shadow-2xl rounded-2xl">
      <button on:click={closeLihatModal} class="absolute flex items-center justify-center w-8 h-8 text-white transition-colors bg-[#0a2e52] hover:bg-red-600 rounded-md shadow-sm top-6 right-6 z-10">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>

      <div class="p-8 md:p-10 space-y-8 overflow-y-auto max-h-[90vh]">
        <div>
          <h2 class="text-lg font-extrabold text-gray-800 pr-10">{selectedJadwal.judul}</h2>
          <p class="mt-1 text-xs font-medium text-gray-500">{selectedJadwal.tanggal} • {selectedJadwal.waktu}</p>
        </div>

        {#if selectedSiswaDetail.jawaban}
          <div class="flex items-center gap-4">
            <span class="text-[3.5rem] leading-none drop-shadow-sm">{selectedSiswaDetail.jawaban.moodEmoji}</span>
            <div class="flex flex-col">
              <span class="text-sm font-extrabold text-gray-800">{selectedSiswaDetail.jawaban.moodText}</span>
              <span class="text-[11px] font-semibold text-gray-400">{selectedSiswaDetail.jawaban.tanggal}</span>
            </div>
          </div>

          <div class="space-y-1.5">
            <h4 class="text-sm font-extrabold text-gray-800">Apa yang kamu pelajari?</h4>
            <p class="text-sm font-medium leading-relaxed text-gray-500">{selectedSiswaDetail.jawaban.pelajaran}</p>
          </div>

          <div class="space-y-3">
            <h4 class="text-sm font-extrabold text-gray-800">Bukti</h4>
            {#if selectedSiswaDetail.jawaban.bukti}
              <div class="flex items-center justify-center w-full bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
                <img 
                  src={`http://localhost:9999/assets/${selectedSiswaDetail.jawaban.bukti}`} 
                  alt="Bukti Absen" 
                  class="max-w-full h-auto object-cover"
                />
                
              </div>
            {:else}
              <div class="flex items-center justify-center w-full bg-gray-50 border border-gray-200 border-dashed rounded-xl h-44">
                <div class="flex flex-col items-center gap-2 text-gray-400">
                  <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  <span class="text-xs font-semibold">Tidak ada lampiran gambar</span>
                </div>
              </div>
            {/if}
          </div>
        {:else}
          <p class="text-center text-gray-500">Belum ada data absen</p>
        {/if}
      </div>
    </div>
  </div>
{/if}