<script>
  import { push } from "svelte-spa-router";
  import { onMount } from "svelte";
  import Swal from "sweetalert2";

  let jadwalList = [];
  let isLoading = true;

  let teamOptions = ["Team A", "Team B", "Team C"];
  let tipeOptions = ["Tournament", "Scrim"];

  $: statistik = {
    jadwalTournament: jadwalList.filter(j => j.tipe === "Tournament").length,
    jadwalScrim: jadwalList.filter(j => j.tipe === "Scrim").length,
    jumlahTeam: 0, // Temporary karena team sudah dihapus
  };

  // Modal state
  let isModalOpen = false;
  let formData = {
    namaAcara: '',
    tanggalAcara: '',
    lokasi: '',
    hanyaUntukTim: false
  };

  function openModal() { isModalOpen = true; }
  function closeModal() {
    isModalOpen = false;
    formData = {
      namaAcara: '',
      tanggalAcara: '',
      lokasi: '',
      hanyaUntukTim: false
    };
  }

  // Fungsi untuk mengambil data jadwal dari backend
  // Fungsi untuk mengambil data jadwal dari backend
async function fetchJadwalData() {
  isLoading = true;
  try {
    const response = await fetch('/api/kegiatan/', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('Response dari backend:', result);
      
      // Mengambil data dari struktur response: result.data.data
      const kegiatanData = result.data?.data || [];
      
      // Transformasi data dari backend ke format yang digunakan di frontend
      jadwalList = kegiatanData.map(item => ({
        id: item.id,
        event: item.nama_kegiatan,
        waktu: formatDate(item.tanggal_kegiatan), // ← pakai format baru
        lokasi: item.jam,
        teamOnly: item.onlyTeam ? "Ya" : "Tidak",
        status: getStatus(item.tanggal_kegiatan),
        tipe: item.onlyTeam ? "Team Only" : "Public",
        team: "-"
      }));
      
      console.log('JadwalList setelah transformasi:', jadwalList);
    } else {
      console.error('Gagal fetch data:', response.status);
      jadwalList = [];
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    jadwalList = [];
  } finally {
    isLoading = false;
  }
}

// Fungsi helper untuk format tanggal (contoh: 1 Januari 2025)
function formatDate(dateString) {
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
  // Fungsi untuk menentukan status berdasarkan tanggal
  function getStatus(dateString) {
    if (!dateString) return "Upcoming";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const kegiatanDate = new Date(dateString);
    kegiatanDate.setHours(0, 0, 0, 0);
    
    if (kegiatanDate < today) {
      return "Selesai";
    } else if (kegiatanDate.getTime() === today.getTime()) {
      return "Hari Ini";
    } else {
      const diffTime = kegiatanDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return `In ${diffDays} days`;
    }
  }

  async function handleSubmit() {
    // Validasi field yang wajib diisi
    if (!formData.namaAcara || !formData.tanggalAcara || !formData.lokasi) {
      Swal.fire({ 
        icon: "warning", 
        title: "Lengkapi semua field!", 
        text: "Nama Acara, Tanggal Acara, dan Jam Kegiatan wajib diisi.",
        confirmButtonColor: "#0a4682" 
      });
      return;
    }

    const payload = {
      nama_kegiatan: formData.namaAcara,
      tanggal_kegiatan: formData.tanggalAcara,
      jam: formData.lokasi,
      onlyTeam: formData.hanyaUntukTim || false
    };

    try {
      Swal.fire({
        title: "Menyimpan data...",
        text: "Mohon tunggu sebentar",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const response = await fetch(`/api/kegiatan/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.status !== 200) {
        Swal.fire({ 
          icon: "error", 
          title: "Gagal Membuat Kegiatan!", 
          text: result.message || result.body || "Data tidak tersimpan di server.",
          confirmButtonColor: "#0a4682" 
        });
        return;
      }

      Swal.fire({ 
        icon: "success", 
        title: "Jadwal berhasil dibuat!", 
        text: result.message || "Data telah tersimpan di server.",
        confirmButtonColor: "#0a4682" 
      });
      
      closeModal();
      
      // Refresh data dari backend setelah submit
      await fetchJadwalData();
      
    } catch (error) {
      console.error('Error:', error);
      Swal.fire({ 
        icon: "error", 
        title: "Gagal menyimpan jadwal!", 
        text: error.message || "Terjadi kesalahan saat menghubungi server.",
        confirmButtonColor: "#0a4682" 
      });
    }
  }

  let currentUserName = "Loading...";

  onMount(() => {
    const name = localStorage.getItem("user_name");
    if (name) {
      currentUserName = name;
    } else {
      push("/");
    }
    
    if(localStorage.getItem("role") !== "admin"){
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
    if(!userStatus){
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
    
    // Ambil data jadwal saat halaman dimuat
    fetchJadwalData();
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

<!-- HTML section - tambahkan loading state -->
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
            class="flex items-center w-full gap-3 px-4 py-2.5 text-sm transition-colors rounded-lg text-gray-300 hover:bg-white/5 hover:text-white"
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
            class="flex items-center w-full gap-3 px-4 py-2.5 text-sm font-medium text-white transition-colors rounded-lg bg-white/10"
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
        <h1 class="hidden text-base font-bold text-gray-700 md:block">Jadwal</h1>
      </div>

      <div class="relative">
        <button
          on:click={toggleDropdown}
          class="flex items-center gap-2 px-2 py-1 transition-colors rounded-md cursor-pointer md:gap-3 hover:bg-gray-50 focus:outline-none"
        >
          <div class="w-11 h-11 rounded-full bg-gray-400 flex items-center justify-center">
            <span class="text-lg font-bold text-black">{currentUserName.charAt(0).toUpperCase()}</span>
          </div>
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

    <main class="flex-1 p-4 overflow-x-hidden overflow-y-auto sm:p-6 lg:p-10 bg-gray-50">
      <div class="max-w-full mx-auto space-y-7">
        
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 class="text-2xl font-extrabold text-gray-800 lg:text-3xl">Event & Tournament</h2>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
          <div class="flex flex-col justify-center p-5 bg-white border border-gray-100 shadow-sm sm:p-6 rounded-2xl">
            <div class="flex items-center justify-center w-12 h-12 mb-4 text-green-700 bg-green-100 rounded-xl">
              <svg class="w-6 h-6"  viewBox="0 0 2048 2048">
                <path fill="#46a46a" d="M1792 993q60 41 107 93t81 114t50 131t18 141q0 119-45 224t-124 183t-183 123t-224 46q-91 0-176-27t-156-78t-126-122t-85-157H128V128h256V0h128v128h896V0h128v128h256v865zM256 256v256h1408V256h-128v128h-128V256H512v128H384V256H256zm643 1280q-3-31-3-64q0-86 24-167t73-153h-97v-128h128v86q41-51 91-90t108-67t121-42t128-15q100 0 192 33V640H256v896h643zm573 384q93 0 174-35t142-96t96-142t36-175q0-93-35-174t-96-142t-142-96t-175-36q-93 0-174 35t-142 96t-96 142t-36 175q0 93 35 174t96 142t142 96t175 36zm64-512h192v128h-320v-384h128v256zM384 1024h128v128H384v-128zm256 0h128v128H640v-128zm0-256h128v128H640V768zm0 512h128v128H640v-128zm384-384H896V768h128v128zm256 0h-128V768h128v128zM384 768h128v128H384V768z"/>
              </svg>
            </div>
            <h3 class="text-4xl font-black text-gray-800">{jadwalList.length}</h3>
            <p class="mt-1 text-sm font-medium text-gray-500">Total Jadwal</p>
          </div>

          <div class="flex flex-col justify-center p-5 bg-white border border-gray-100 shadow-sm sm:p-6 rounded-2xl">
            <div class="flex items-center justify-center w-12 h-12 mb-4 text-green-700 bg-green-100 rounded-xl">
              <svg class="w-6 h-6"  viewBox="0 0 2048 2048">
                <path fill="#46a46a" d="M1792 993q60 41 107 93t81 114t50 131t18 141q0 119-45 224t-124 183t-183 123t-224 46q-91 0-176-27t-156-78t-126-122t-85-157H128V128h256V0h128v128h896V0h128v128h256v865zM256 256v256h1408V256h-128v128h-128V256H512v128H384V256H256zm643 1280q-3-31-3-64q0-86 24-167t73-153h-97v-128h128v86q41-51 91-90t108-67t121-42t128-15q100 0 192 33V640H256v896h643zm573 384q93 0 174-35t142-96t96-142t36-175q0-93-35-174t-96-142t-142-96t-175-36q-93 0-174 35t-142 96t-96 142t-36 175q0 93 35 174t96 142t142 96t175 36zm64-512h192v128h-320v-384h128v256zM384 1024h128v128H384v-128zm256 0h128v128H640v-128zm0-256h128v128H640V768zm0 512h128v128H640v-128zm384-384H896V768h128v128zm256 0h-128V768h128v128zM384 768h128v128H384V768z"/>
              </svg>
            </div>
            <h3 class="text-4xl font-black text-gray-800">{jadwalList.filter(j => j.teamOnly === "Ya").length}</h3>
            <p class="mt-1 text-sm font-medium text-gray-500">Team Only</p>
          </div>

          <div class="flex flex-col justify-center p-5 bg-white border border-gray-100 shadow-sm sm:p-6 rounded-2xl sm:col-span-2 lg:col-span-1">
            <div class="flex items-center justify-center w-12 h-12 mb-4 text-green-700 bg-green-100 rounded-xl">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 class="text-4xl font-black text-gray-800">{jadwalList.filter(j => j.teamOnly === "Tidak").length}</h3>
            <p class="mt-1 text-sm font-medium text-gray-500">Public</p>
          </div>
        </div>

        <div class="overflow-hidden bg-white border border-gray-100 shadow-sm rounded-2xl">
          <div class="px-4 py-5 flex items-center justify-between border-b border-gray-100 sm:px-6">
            <h3 class="text-lg font-bold text-gray-800">Jadwal</h3>
            <button
            on:click={openModal}
            class="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-white transition-all bg-[#0a4682] rounded-lg shadow-md hover:bg-[#0c5599] hover:shadow-lg active:scale-95"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Buat Jadwal
          </button>
          </div>

          {#if isLoading}
            <div class="flex justify-center items-center p-8">
              <div class="text-center">
                <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#0a4682]"></div>
                <p class="mt-2 text-gray-500">Memuat data...</p>
              </div>
            </div>
          {:else if jadwalList.length === 0}
            <div class="text-center p-8 text-gray-500">
              <p>Belum ada jadwal</p>
            </div>
          {:else}
            <div class="hidden overflow-x-auto sm:block max-h-[400px]">
              <table class="w-full text-left border-collapse">
                <thead class="sticky top-0 z-10 bg-gray-50 outline outline-1 outline-gray-100">
                  <tr class="text-sm text-gray-500 border-b border-gray-100 bg-gray-50">
                    <th class="px-6 py-4 font-semibold">Event</th>
                    <th class="px-6 py-4 font-semibold">Waktu</th>
                    <th class="px-6 py-4 font-semibold">Jam</th>
                    <th class="px-6 py-4 font-semibold">Team Only</th>
                    <th class="px-6 py-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody class="text-sm text-gray-700">
                  {#each jadwalList as jadwal}
                    <tr class="transition-colors border-b border-gray-50 hover:bg-gray-50/50">
                      <td class="px-6 py-4 font-medium text-gray-900">{jadwal.event}</td>
                      <td class="px-6 py-4">{jadwal.waktu}</td>
                      <td class="px-6 py-4">{jadwal.lokasi}</td>
                      <td class="px-6 py-4">
                        <span class="inline-flex items-center px-2 py-1 text-xs font-bold rounded-full {jadwal.teamOnly === 'Ya' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}">
                          {jadwal.teamOnly}
                        </span>
                      </td>
                      <td class="px-6 py-4">
                        <span class="inline-flex items-center px-3 py-1 text-xs font-bold rounded-full {jadwal.status === 'Selesai' ? 'bg-gray-200 text-gray-600' : jadwal.status === 'Hari Ini' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}">
                          {jadwal.status}
                        </span>
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>

            <div class="block space-y-3 sm:hidden p-4">
              {#each jadwalList as jadwal}
                <div class="p-4 border border-gray-100 rounded-xl bg-gray-50/50">
                  <div class="flex items-start justify-between mb-2">
                    <h4 class="text-sm font-bold text-gray-900">{jadwal.event}</h4>
                    <span class="inline-flex items-center px-2.5 py-0.5 text-xs font-bold rounded-full {jadwal.status === 'Selesai' ? 'bg-gray-200 text-gray-600' : jadwal.status === 'Hari Ini' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}">
                      {jadwal.status}
                    </span>
                  </div>
                  <div class="space-y-1 text-xs text-gray-600">
                    <p><span class="font-semibold">Waktu:</span> {jadwal.waktu}</p>
                    <p><span class="font-semibold">Jam:</span> {jadwal.lokasi}</p>
                    <p><span class="font-semibold">Team Only:</span> {jadwal.teamOnly}</p>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
        
      </div>
    </main>
  </div>

  {#if isModalOpen}
    <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div
        class="absolute inset-0 cursor-pointer bg-black/40 backdrop-blur-sm"
        on:click={closeModal}
        aria-hidden="true"
      ></div>

      <div class="relative flex flex-col w-full max-w-lg shadow-2xl bg-[#f8fafc] rounded-xl max-h-[90vh]">
        
        <div class="flex items-center justify-between p-5 bg-white border-b border-gray-100 sm:p-6 rounded-t-xl">
          <h2 class="text-lg font-extrabold text-gray-800 sm:text-xl">Buat Jadwal</h2>
          <button
            on:click={closeModal}
            class="flex items-center justify-center w-8 h-8 text-white transition-colors shadow-sm bg-[#0a2e52] hover:bg-red-600 rounded-md"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="p-5 space-y-4 overflow-y-auto sm:p-6">
          <div>
            <label for="namaAcara" class="block mb-1.5 text-sm font-semibold text-gray-700">Nama Acara</label>
            <input
              id="namaAcara"
              type="text"
              bind:value={formData.namaAcara}
              class="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="Masukkan nama acara"
            />
          </div>

          <div>
            <label for="tanggalAcara" class="block mb-1.5 text-sm font-semibold text-gray-700">Tanggal Acara</label>
            <input
              id="tanggalAcara"
              type="date"
              bind:value={formData.tanggalAcara}
              class="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div>
            <label for="Jam" class="block mb-1.5 text-sm font-semibold text-gray-700">Jam Kegiatan</label>
            <input
              id="Jam"
              type="time"
              bind:value={formData.lokasi}
              class="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="Masukkan Jam"
            />
          </div>

          <!-- Checkbox untuk "Hanya untuk yang memiliki tim?" -->
          <div class="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <input
              type="checkbox"
              id="hanyaUntukTim"
              bind:checked={formData.hanyaUntukTim}
              class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
            />
            <label for="hanyaUntukTim" class="text-sm font-semibold text-gray-700 cursor-pointer">
              Hanya untuk yang memiliki tim?
            </label>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 p-5 bg-white border-t border-gray-100 sm:p-6 rounded-b-xl">
          <button
            on:click={closeModal}
            class="px-6 py-2.5 text-sm font-bold text-white transition-all bg-red-600 rounded-lg shadow-md hover:bg-red-700 active:scale-95"
          >
            Cancel
          </button>
          <button
            on:click={handleSubmit}
            class="px-6 py-2.5 text-sm font-bold text-white transition-all bg-[#0a4682] rounded-lg shadow-md hover:bg-[#0c5599] active:scale-95"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>