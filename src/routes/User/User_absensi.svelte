<script>
  import { push } from "svelte-spa-router";
  import { onMount } from "svelte";
  import Swal from "sweetalert2";
  import {fetchWithAuth} from "$lib/auth.js"
  
  let currentUserName = "Loading...";
  let userAvatar = "";
  let activeTab = "tersedia";
  let isLoading = true;

  // State untuk menyimpan data kegiatan dan absen
  let semuaKegiatan = []; // Semua kegiatan dari backend
  let absenDataMap = new Map(); // Map untuk menyimpan data absen (kegiatan_id -> data absen)
  let userTeam = null; // Tim user dari localStorage
  
  // Aktivitas yang sudah difilter
  let aktivitasTersedia = [];
  let aktivitasSelesai = [];

  // Absen modal
  let isAbsenModalOpen = false;
  let selectedAktivitas = null;

  let formAbsen = {
    pelajaran: "",
    bukti: null, 
    mood: ""     
  };

  // State untuk drag & drop
  let isDragOver = false;
  let uploadedFileName = "";
  let uploadedFileSize = "";

  // Ambil tim user dari localStorage
  function getUserTeam() {
    try {
      const userTeamStr = localStorage.getItem("tim");
      if (userTeamStr !== "null" && userTeamStr !== "undefined") {
        userTeam = userTeamStr;
        console.log("User team:", userTeam);
      } else {
        userTeam = null;
        console.log("User tidak memiliki tim");
      }
    } catch (error) {
      console.error("Error getting user team:", error);
      userTeam = null;
    }
  }

  // Format tanggal ke format Indonesia
  function formatTanggal(dateString) {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", { 
      day: "numeric", 
      month: "long", 
      year: "numeric" 
    });
  }

  // Cek apakah hari ini sama dengan tanggal kegiatan
  function isSameDay(kegiatanTanggal) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const kegiatanDate = new Date(kegiatanTanggal);
    kegiatanDate.setHours(0, 0, 0, 0);
    
    return today.getTime() === kegiatanDate.getTime();
  }

  // Cek apakah kegiatan sudah terlewat (tanggalnya kurang dari hari ini)
  function isExpired(kegiatanTanggal) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const kegiatanDate = new Date(kegiatanTanggal);
    kegiatanDate.setHours(0, 0, 0, 0);
    
    return kegiatanDate < today;
  }

  // Ambil daftar kegiatan yang sudah di-absen dari backend
  async function fetchSudahAbsenData() {
    try {
      const userId = localStorage.getItem("user_id");
      
      const response = await fetchWithAuth(`/api/absen/get/complete?user_id=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Gagal mengambil data absen');
      }

      const result = await response.json();
      
      if (result.data && Array.isArray(result.data)) {
        absenDataMap.clear();
        result.data.forEach(item => {
          absenDataMap.set(item.kegiatan_id, {
            createdAt: item.createdAt,
            deskripsi: item.deskripsi || null,
            mood: item.mood || null,
            bukti_url: item.bukti_url || null
          });
        });
      }
      
      console.log('Absen data map:', absenDataMap);
      
    } catch (error) {
      console.error('Error fetching sudah absen data:', error);
      absenDataMap.clear();
    }
  }

  // Ambil semua kegiatan dari backend
  async function fetchSemuaKegiatan() {
    try {
      const userId = localStorage.getItem("user_id");
      
      if (!userId) {
        Swal.fire({
          icon: 'error',
          title: 'User Tidak Ditemukan',
          text: 'Silakan login kembali',
          confirmButtonColor: '#0b5ba2'
        }).then(() => {
          push('/SignIn');
        });
        return;
      }

      const response = await fetchWithAuth(`/api/kegiatan?user_id=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Gagal mengambil data kegiatan');
      }

      const result = await response.json();
      
      if (result.data && result.data.data) {
        semuaKegiatan = result.data.data.map(kegiatan => {
          const absenData = absenDataMap.get(kegiatan.id);
          const sudahAbsen = !!absenData;
          
          return {
            id: kegiatan.id,
            judul: kegiatan.nama_kegiatan || kegiatan.judul,
            tanggal: formatTanggal(kegiatan.tanggal_kegiatan),
            tanggalRaw: kegiatan.tanggal_kegiatan,
            waktu: kegiatan.jam || "-",
            hanyaUntukTim: kegiatan.onlyTeam || false,
            sudahAbsen: sudahAbsen,
            createdAt: sudahAbsen ? absenData.createdAt : null,
            deskripsi: sudahAbsen ? absenData.deskripsi : null,
            mood: sudahAbsen ? absenData.mood : null,
            bukti_url: sudahAbsen ? absenData.bukti_url : null
          };
        });
      } else {
        semuaKegiatan = [];
      }
      
      // Filter kegiatan berdasarkan status dan tim user
      filterKegiatan();
      
    } catch (error) {
      console.error('Error fetching kegiatan:', error);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Memuat Data',
        text: 'Tidak dapat mengambil data kegiatan. Silakan coba lagi.',
        confirmButtonColor: '#0b5ba2'
      });
      semuaKegiatan = [];
      filterKegiatan();
    } finally {
      isLoading = false;
    }
  }

  // Filter kegiatan berdasarkan status, hak akses tim, dan tanggal
  function filterKegiatan() {
    // Filter kegiatan yang boleh dilihat user (berdasarkan onlyTeam)
    let kegiatanYangBolehDilihat = semuaKegiatan.filter(kegiatan => {
      // Jika kegiatan hanya untuk tim (onlyTeam = true)
      if (kegiatan.hanyaUntukTim) {
        // Hanya tampilkan jika user memiliki tim
        return userTeam !== null && userTeam !== undefined && userTeam !== "null";
      }
      // Jika kegiatan public (onlyTeam = false), tampilkan untuk semua
      return true;
    });
    
    // Filter lagi: Hanya tampilkan kegiatan yang BELUM lewat (kecuali yang sudah absen)
    // Kegiatan yang sudah lewat dan belum absen TIDAK ditampilkan di tab tersedia
    let kegiatanTersediaFilter = kegiatanYangBolehDilihat.filter(k => {
      // Jika sudah absen, tetap tampilkan (akan masuk ke tab selesai)
      if (k.sudahAbsen) return true;
      // Jika belum absen, hanya tampilkan jika belum lewat (hari ini atau masa depan)
      return !isExpired(k.tanggalRaw);
    });
    
    // Kegiatan yang sudah di-absen
    aktivitasSelesai = [...kegiatanTersediaFilter.filter(k => k.sudahAbsen)]
      .sort((a, b) => {
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
    
    // Kegiatan yang belum di-absen (belum lewat)
    aktivitasTersedia = kegiatanTersediaFilter.filter(k => !k.sudahAbsen);
    
    console.log('Kegiatan setelah filter:', {
      total: kegiatanYangBolehDilihat.length,
      tersedia: aktivitasTersedia.length,
      selesai: aktivitasSelesai.length,
      userTeam: userTeam
    });
  }

  // Kirim absen ke backend
  async function submitAbsenToBackend(kegiatanId, formData) {
    try {
      const response = await fetch(`/api/absen/${kegiatanId}/create`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Gagal mengirim absen');
      }

      const result = await response.json();
      return { success: true, data: result };
    } catch (error) {
      console.error('Error submitting absen:', error);
      return { success: false, error: error.message };
    }
  }

  function openAbsenModal(aktivitas) {
    // Validasi: cek apakah hari ini sama dengan tanggal kegiatan
    if (!isSameDay(aktivitas.tanggalRaw)) {
      Swal.fire({
        icon: "error",
        title: "Tidak Bisa Absen",
        text: "Absen hanya bisa dilakukan pada hari pelaksanaan kegiatan!",
        confirmButtonColor: "#ef4444"
      });
      return;
    }
    
    selectedAktivitas = aktivitas;
    formAbsen = { pelajaran: "", bukti: null, mood: "" };
    uploadedFileName = "";
    uploadedFileSize = "";
    isDragOver = false;
    isAbsenModalOpen = true;
  }

  function closeAbsenModal() {
    isAbsenModalOpen = false;
    selectedAktivitas = null;
  }

  function setMood(pilihan) {
    formAbsen.mood = pilihan;
  }

  // Format file size
  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Handle file upload
  function handleFileUpload(file) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    const maxSize = 2 * 1024 * 1024; // 2MB
    
    if (!allowedTypes.includes(file.type) && !file.type.startsWith('image/')) {
      Swal.fire({
        icon: "error",
        title: "Format Tidak Didukung",
        text: "Silakan upload file JPG atau PNG"
      });
      return false;
    }
    
    if (file.size > maxSize) {
      Swal.fire({
        icon: "error",
        title: "Ukuran Terlalu Besar",
        text: "Maksimal ukuran file adalah 2MB"
      });
      return false;
    }
    
    formAbsen.bukti = file;
    uploadedFileName = file.name;
    uploadedFileSize = formatFileSize(file.size);
    
    Swal.fire({
      icon: "success",
      title: "Berhasil!",
      text: `File ${file.name} berhasil diupload`,
      timer: 1500,
      showConfirmButton: false
    });
    
    return true;
  }

  // Drag & drop handlers
  function onDragOver(event) {
    event.preventDefault();
    isDragOver = true;
  }
  
  function onDragLeave(event) {
    event.preventDefault();
    isDragOver = false;
  }
  
  function onDrop(event) {
    event.preventDefault();
    isDragOver = false;
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }
  
  function onFileSelect(event) {
    const files = event.target.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }
  
  function removeFile() {
    formAbsen.bukti = null;
    uploadedFileName = "";
    uploadedFileSize = "";
    const fileInput = document.getElementById('fileInput');
    if (fileInput) fileInput.value = '';
  }

  async function submitAbsen() {
    if (!formAbsen.pelajaran || !formAbsen.mood) {
      Swal.fire({ icon: "warning", title: "Data Belum Lengkap", text: "Pastikan semua telah diisi!" });
      return;
    }
    
    if (!formAbsen.bukti) {
      Swal.fire({ icon: "warning", title: "Bukti Belum Diupload", text: "Silakan upload bukti kegiatan terlebih dahulu!" });
      return;
    }

    Swal.fire({
      title: 'Mengirim data...',
      text: 'Mohon tunggu sebentar',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    let formData = new FormData();
    formData.append('deskripsi', formAbsen.pelajaran);
    formData.append('mood', formAbsen.mood);
    formData.append('bukti', formAbsen.bukti);

    const result = await submitAbsenToBackend(selectedAktivitas.id, formData);

    if (result.success) {
      // Tambahkan data absen ke map
      const nowIso = new Date().toISOString();
      absenDataMap.set(selectedAktivitas.id, {
        createdAt: result.data?.createdAt || nowIso,
        deskripsi: formAbsen.pelajaran,
        mood: formAbsen.mood,
        bukti_url: result.data?.bukti_url || null
      });
      
      // Update kegiatan yang sudah di-absen
      const updatedKegiatan = {
        ...selectedAktivitas,
        sudahAbsen: true,
        createdAt: result.data?.createdAt || nowIso,
        deskripsi: formAbsen.pelajaran,
        mood: formAbsen.mood,
        bukti_url: result.data?.bukti_url || null
      };
      
      // Update di semuaKegiatan
      semuaKegiatan = semuaKegiatan.map(k => 
        k.id === selectedAktivitas.id ? updatedKegiatan : k
      );
      
      // Refresh filter
      filterKegiatan();

      Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: "Absen kamu telah terkirim. Terima kasih!",
        timer: 2000,
        showConfirmButton: false
      });
      
      closeAbsenModal();
    } else {
      Swal.fire({ 
        icon: "error", 
        title: "Gagal!", 
        text: result.error || "Terjadi kesalahan saat mengirim absen", 
        confirmButtonColor: "#ef4444" 
      });
    }
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
        localStorage.clear();
        push("/");
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

  // Initial load
  onMount(async () => {
    const name = localStorage.getItem("user_name") || "User";
    currentUserName = name;
    
    // Ambil tim user dari localStorage
    getUserTeam();
    
    const userRole = localStorage.getItem("user_role");
    if(userRole !== "user"){
      Swal.fire({
        icon: 'error',
        title: 'Unauthorized',
        text: 'Redirecting......',
        confirmButtonColor: '#0b5ba2'
      }).then(() => {
        push('/admin/beranda');
      });
      return;
    }

    const userStatus = localStorage.getItem("status");
    if(userStatus === "false"){
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
    
    // Step 1: Ambil data absen
    await fetchSudahAbsenData();
    
    // Step 2: Ambil semua kegiatan
    await fetchSemuaKegiatan();
  });
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
        <button on:click={() => { window.location.href = '#/user/absensi'; }} class="flex items-center w-full gap-3 px-4 py-2.5 text-sm font-medium text-white transition-colors rounded-lg bg-white/10">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
          Dashboard
        </button>
        <button on:click={() => { window.location.href = "#/user/kegiatan"; }} class="flex items-center w-full gap-3 px-4 py-2.5 text-sm transition-colors rounded-lg text-gray-300 hover:bg-white/5 hover:text-white">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
          Kegiatan
        </button>
        <button on:click={() => { window.location.href = "#/user/analisis"; }} class="flex items-center w-full gap-3 px-4 py-2.5 text-sm transition-colors rounded-lg text-gray-300 hover:bg-white/5 hover:text-white">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
          Analisis
        </button>
      </div>
      
      <div class="p-5">
        <button on:click={handleLogout} class="flex items-center justify-center w-full py-2.5 text-sm font-semibold text-white transition-colors bg-red-600 rounded-lg shadow-md hover:bg-red-700">
          Logout
        </button>
      </div>
    </nav>
  </aside>

  <div class="flex flex-col flex-1 h-full overflow-hidden">
    <header class="flex items-center justify-between h-16 px-8 transition-all duration-300 bg-white border-b border-gray-200 shadow-sm shrink-0 z-10">
      <div class="flex items-center gap-3 text-gray-600">
        <button on:click={toggleSidebar} class="flex items-center justify-center p-1.5 transition-colors rounded-md cursor-pointer hover:bg-gray-100 text-gray-800">
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
        <button on:click={toggleDropdown} class="flex items-center gap-2 px-2 py-1 transition-colors rounded-md cursor-pointer md:gap-3 hover:bg-gray-50 focus:outline-none">
          {#if userAvatar}
            <img src={userAvatar} alt="Profile" class="w-11 h-11 rounded-full object-cover border border-gray-200 shadow-sm" />
          {:else}
            <div class="w-11 h-11 rounded-full bg-gray-400 flex items-center justify-center">
              <span class="text-lg font-bold text-black">{currentUserName.charAt(0).toUpperCase()}</span>
            </div>
          {/if}
          <span class="text-sm font-bold text-gray-700">{currentUserName}</span>
          <svg class="w-4 h-4 text-gray-400 transition-transform duration-200 {isDropdownOpen ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {#if isDropdownOpen}
          <div class="fixed inset-0 z-40" on:click={closeDropdown} aria-hidden="true"></div>
          <div class="absolute right-0 z-50 w-48 py-2 mt-2 bg-white border border-gray-100 rounded-lg shadow-lg">
            <button on:click={() => { window.location.href = '#/user/settings'; closeDropdown(); }} class="flex items-center w-full gap-2 px-4 py-2.5 text-sm text-gray-700 transition-colors text-left hover:bg-gray-50">
              <img class="w-4 h-4 text-gray-500" src="src/assets/setting.svg" alt="Settings Icon" />
              Settings
            </button>
            <div class="w-full h-px my-1 bg-gray-100"></div>
            <button on:click={handleLogout} class="flex items-center w-full gap-2 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors text-left hover:bg-red-50">
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

        {#if userTeam}
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
            Anda terdaftar sebagai anggota tim <strong>{userTeam}</strong>
          </div>
        {:else}
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-700">
            Anda belum memiliki tim. Beberapa kegiatan yang bersifat "Team Only" tidak akan terlihat.
          </div>
        {/if}

        <!-- Loading State -->
        {#if isLoading}
          <div class="flex justify-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0a2e52]"></div>
          </div>
        {:else}
          <div class="flex gap-4 border-b border-gray-200">
            <button 
              on:click={() => activeTab = 'tersedia'}
              class="px-6 py-3 text-sm font-bold transition-all duration-200 border-b-2 {activeTab === 'tersedia' ? 'border-[#0a2e52] text-[#0a2e52]' : 'border-transparent text-gray-500 hover:text-gray-700'}"
            >
              Aktivitas Tersedia ({aktivitasTersedia.length})
            </button>
            <button 
              on:click={() => activeTab = 'selesai'}
              class="px-6 py-3 text-sm font-bold transition-all duration-200 border-b-2 {activeTab === 'selesai' ? 'border-[#0a2e52] text-[#0a2e52]' : 'border-transparent text-gray-500 hover:text-gray-700'}"
            >
              Aktivitas Selesai ({aktivitasSelesai.length})
            </button>
          </div>

          <div class="overflow-hidden bg-white border border-gray-200 rounded-xl shadow-sm">
            {#if activeTab === 'tersedia'}
              <div class="flex flex-col">
                {#each aktivitasTersedia as item, index}
                  <div class="flex items-center justify-between p-5 {index !== aktivitasTersedia.length - 1 ? 'border-b border-gray-100' : ''} hover:bg-gray-50 transition-colors">
                    <div>
                      <span class="text-[15px] font-semibold text-gray-700">{item.judul}</span>
                      {#if item.hanyaUntukTim}
                        <span class="ml-2 px-2 py-0.5 text-[10px] font-bold text-blue-600 bg-blue-100 rounded-full">Team Only</span>
                      {/if}
                      <div class="flex gap-3 mt-1 text-xs text-gray-400">
                        <span>{item.tanggal}</span>
                        <span>{item.waktu}</span>
                      </div>
                    </div>
                    
                    {#if isSameDay(item.tanggalRaw)}
                      <button 
                        on:click={() => openAbsenModal(item)}
                        class="px-8 py-2.5 text-sm font-bold text-white bg-[#0a2e52] rounded-md hover:bg-blue-900 transition-colors shadow-sm"
                      >
                        Absensi
                      </button>
                    {:else}
                      <button 
                        disabled
                        class="px-8 py-2.5 text-sm font-bold text-gray-400 bg-gray-200 rounded-md cursor-not-allowed"
                        title="Absen hanya bisa dilakukan pada hari pelaksanaan kegiatan"
                      >
                        Belum Waktunya
                      </button>
                    {/if}
                  </div>
                {:else}
                  <div class="p-8 font-medium text-center text-gray-500">Belum Ada Aktifitas Terbaru!</div>
                {/each}
              </div>
            {:else}
              <div class="flex flex-col">
                {#each aktivitasSelesai as item, index}
                  <div class="flex items-center justify-between p-5 {index !== aktivitasSelesai.length - 1 ? 'border-b border-gray-100' : ''} bg-gray-50/50">
                    <div>
                      <span class="text-[15px] font-semibold text-gray-500 line-through">{item.judul}</span>
                      {#if item.hanyaUntukTim}
                        <span class="ml-2 px-2 py-0.5 text-[10px] font-bold text-blue-600 bg-blue-100 rounded-full">Team Only</span>
                      {/if}
                      <div class="flex gap-3 mt-1 text-xs text-gray-400">
                        <span>{item.tanggal}</span>
                        <span>{item.waktu}</span>
                        <span class="text-green-600">✓ Absen pada {formatTanggal(item.createdAt)}</span>
                      </div>
                    </div>
                    <span class="px-6 py-2 text-sm font-bold text-[#0a2e52] bg-blue-100 border border-[#0a2e52] rounded-md shadow-sm">
                      Selesai
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
              <button on:click={() => {window.location.href = '#/user/analisis'; }} class="flex items-center justify-center w-10 h-10 bg-[#0a2e52] text-white rounded-full hover:bg-blue-900 transition-colors shadow-sm">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
            <div class="flex flex-col items-center justify-center p-8 transition-shadow bg-white border border-gray-200 shadow-sm rounded-2xl hover:shadow-md">
              <div class="flex items-center justify-center w-14 h-14 bg-[#0a2e52] rounded-xl text-white mb-6 shadow-sm">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              </div>
              <h3 class="text-[15px] font-bold text-gray-700 mb-6">Cek Kegiatan</h3>
              <button on:click={() => { window.location.href = '#/user/kegiatan'; }} class="flex items-center justify-center w-10 h-10 bg-[#0a2e52] text-white rounded-full hover:bg-blue-900 transition-colors shadow-sm">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        {/if}
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
        <p class="text-sm font-medium text-gray-500">{selectedAktivitas.tanggal} • {selectedAktivitas.waktu}</p>
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
        
        <div 
          class="flex flex-col items-center justify-center p-10 transition-all duration-200 bg-[#fafafa] border-2 border-dashed rounded-xl {isDragOver ? 'border-[#0a2e52] bg-[#f0f4f9]' : 'border-gray-300'}"
          on:dragover={onDragOver}
          on:dragleave={onDragLeave}
          on:drop={onDrop}
        >
          <div class="flex items-center justify-center w-10 h-10 mb-3 text-white bg-[#0a2e52] rounded-lg shadow-sm">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </div>
          
          {#if !formAbsen.bukti}
            <p class="mb-2 text-xs font-medium text-gray-500">Drag & drop file di sini atau klik tombol di bawah</p>
            <p class="mb-4 text-xs text-gray-400">Format: JPG dan PNG (Max 2MB)</p>
          {:else}
            <div class="mb-3 text-center">
              <div class="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-green-100 rounded-full">
                <svg class="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p class="text-sm font-semibold text-gray-800">{uploadedFileName}</p>
              <p class="text-xs text-gray-500">{uploadedFileSize}</p>
              <button 
                type="button"
                on:click={removeFile}
                class="mt-2 text-xs font-medium text-red-600 hover:text-red-700"
              >
                Hapus file
              </button>
            </div>
          {/if}
          
          <input 
            type="file" 
            id="fileInput"
            accept="image/jpeg,image/jpg,image/png"
            class="hidden"
            on:change={onFileSelect}
          />
          
          <button 
            type="button"
            on:click={() => document.getElementById('fileInput').click()}
            class="px-8 py-2 text-sm font-bold text-white transition-colors bg-[#0a2e52] rounded-lg shadow-sm hover:bg-blue-900"
          >
            {#if formAbsen.bukti}
              Ganti File
            {:else}
              Upload
            {/if}
          </button>
        </div>
      </div>

      <div class="space-y-3">
        <label class="text-sm font-extrabold text-gray-800">
          Mood anda hari ini? <span class="text-red-500">*</span>
        </label>
        <div class="flex gap-4">
          <button 
            type="button"
            on:click={() => setMood('baik')}
            class="text-5xl transition-transform transform hover:scale-110 focus:outline-none {formAbsen.mood === 'baik' ? 'scale-110 drop-shadow-md grayscale-0' : 'grayscale opacity-70 hover:grayscale-0 hover:opacity-100'}"
          >
            😊
          </button>
          <button 
            type="button"
            on:click={() => setMood('buruk')}
            class="text-5xl transition-transform transform hover:scale-110 focus:outline-none {formAbsen.mood === 'buruk' ? 'scale-110 drop-shadow-md grayscale-0' : 'grayscale opacity-70 hover:grayscale-0 hover:opacity-100'}"
          >
            😔
          </button>
          <button 
            type="button"
            on:click={() => setMood('biasa')}
            class="text-5xl transition-transform transform hover:scale-110 focus:outline-none {formAbsen.mood === 'biasa' ? 'scale-110 drop-shadow-md grayscale-0' : 'grayscale opacity-70 hover:grayscale-0 hover:opacity-100'}"
          >
            😐
          </button>
        </div>
      </div>

    </div>

    <div class="flex justify-end p-8 pt-0">
      <button type="button" on:click={submitAbsen} class="px-10 py-3 font-bold text-white transition-colors bg-[#0a2e52] rounded-xl shadow-md hover:bg-blue-900">
        Kirim
      </button>
    </div>

  </div>
</div>
{/if}

<style>
  .animate-fade-in {
    animation: fadeIn 0.2s ease-in-out;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
</style>