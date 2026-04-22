<script>
  import { push } from "svelte-spa-router";
  import { onMount } from "svelte";
  import Swal from "sweetalert2";

  let currentUserName = "Loading...";

  onMount(() => {
    const name = localStorage.getItem("user_name");
    if (name) {
      currentUserName = name;
    } else {
      push("/");
    }
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

  let totalUserDiDatabase = 100; 

  $: jadwalTerbaru = jadwalAbsen.length > 0 ? jadwalAbsen[jadwalAbsen.length - 1] : { totalHadir: 0 };

  $: statistikAbsen = {
    sudahAbsen: jadwalTerbaru.totalHadir,
    belumAbsen: totalUserDiDatabase - jadwalTerbaru.totalHadir
  };

let jadwalAbsen = [
    {
      minggu: "Week 1",
      judul: "Latihan Taktik Mingguan",
      tanggal: "9 Juni 2026",
      waktu: "15.00 - 17.00",
      totalHadir: 50, 
      statusTanggal: "-",
      statusWaktu: "-",
      isDisabled: false 
    },
  ];
  let isAddJadwalModalOpen = false;

  let formJadwal = {
    minggu: "",
    judul: "",
    tanggal: "",
    jamMulai: "",
    jamSelesai: ""
  };

  function openAddJadwalModal() {
    formJadwal = { minggu: "", judul: "", tanggal: "", jamMulai: "", jamSelesai: "" };
    isAddJadwalModalOpen = true;
  }

  function closeAddJadwalModal() {
    isAddJadwalModalOpen = false;
  }

  function submitJadwalAbsen() {
    // Validasi sederhana
    if (!formJadwal.minggu || !formJadwal.judul || !formJadwal.tanggal || !formJadwal.jamMulai || !formJadwal.jamSelesai) {
      Swal.fire({ icon: "warning", title: "Data Belum Lengkap", text: "Pastikan semua kolom telah diisi!" });
      return;
    }

    const jadwalBaru = {
      minggu: formJadwal.minggu,
      judul: formJadwal.judul,
      tanggal: formJadwal.tanggal, 
      waktu: `${formJadwal.jamMulai} - ${formJadwal.jamSelesai}`,
      totalHadir: 0,
      statusTanggal: "-",
      statusWaktu: "-",
      isDisabled: false 
    };

    jadwalAbsen = [...jadwalAbsen, jadwalBaru];

    closeAddJadwalModal();

    Swal.fire({
      icon: "success",
      title: "Jadwal Dibuat!",
      text: "Absen baru telah berhasil dipublikasikan ke siswa.",
      timer: 1500,
      showConfirmButton: false
    });
  }

  let selectedJadwal = null;

  let isLihatModalOpen = false;
  let selectedSiswaDetail = null;

  function openLihatModal(siswa) {
    selectedSiswaDetail = siswa;
    isLihatModalOpen = true;
  }

  function closeLihatModal() {
    isLihatModalOpen = false;
    selectedSiswaDetail = null;
  }

  let detailSiswaAbsen = [
    { 
      nama: "Ahmad Jack", 
      status: "Sudah Absen", 
      btnLihatDisabled: false,
      jawaban: {
        moodEmoji: "😊",
        moodText: "Good",
        tanggal: "01-01-2000",
        pelajaran: "Lorem ipsum Ayam pak selamat bu jainal",
        bukti: "bukti.jpg"
      }
    },
    { 
      nama: "Bambang back", 
      status: "Belum Absen", 
      btnLihatDisabled: true, 
      jawaban: null 
    },
    { 
      nama: "Siti Pro", 
      status: "Sudah Absen", 
      btnLihatDisabled: false,
      jawaban: {
        moodEmoji: "😐",
        moodText: "Neutral",
        tanggal: "01-01-2000",
        pelajaran: "Hari ini saya belajar rotasi formasi dan cara backup mid-lane.",
        bukti: "Gambar_Bukti_Siti.jpg"
      }
    },
    { 
      nama: "Udin Petot", 
      status: "Belum Absen", 
      btnLihatDisabled: true, 
      jawaban: null 
    }
  ];

  function bukaDetailAbsen(jadwal) {
    selectedJadwal = jadwal;
  }

  function tutupDetailAbsen() {
    selectedJadwal = null;
  }
</script>

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
                window.location.href = '#/beranda';
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
                window.location.href = '#/anggota';
              }} class="flex items-center w-full gap-3 px-4 py-2.5 text-sm transition-colors rounded-lg text-gray-300 hover:bg-white/5 hover:text-white">
              Anggota
            </button>
          <button
            on:click={() => {
              window.location.href = "#/absensi";
            }}
            class="flex items-center w-full gap-3 px-4 py-2.5 text-sm font-medium text-white transition-colors rounded-lg bg-white/10"
          >
            Absensi
          </button>
          <button
            on:click={() => {
              window.location.href = "#/analisis";
            }}
            class="flex items-center w-full gap-3 px-4 py-2.5 text-sm transition-colors rounded-lg text-gray-300 hover:bg-white/5 hover:text-white"
          >
            Analisis
          </button>
          <button
            on:click={() => {
              window.location.href = "#/jadwal";
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
        <h1 class="hidden text-base font-bold text-gray-700 md:block">Absensi </h1>
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
                window.location.href = "#/settings";
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
              <button on:click={openAddJadwalModal} class="px-5 py-2.5 text-sm font-semibold text-[#0a2e52] transition-colors bg-blue-50 border border-blue-100 rounded-lg shadow-sm hover:bg-blue-100 flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" /></svg>
                Absen 
              </button>
            </div>
            
            <div class="space-y-12">
              {#each jadwalAbsen as jadwal}
                <div class="flex flex-col gap-6">
                  <div class="flex items-start justify-between">
                    <div class="space-y-3">
                      <h4 class="text-lg font-extrabold text-gray-800">[{jadwal.minggu}] - {jadwal.judul}</h4>
                      <div class="pl-6 space-y-1.5 text-sm font-medium text-gray-600">
                        <p>{jadwal.tanggal}</p>
                        <p>{jadwal.waktu}</p>
                      </div>
                    </div>
                    <div class="text-right space-y-3 min-w-[120px]">
                      <h4 class="text-lg font-extrabold text-gray-800">Status</h4>
                      <div class="space-y-1.5 text-sm font-medium text-gray-600">
                        <p class="font-bold {jadwal.totalHadir > 0 ? 'text-green-600' : 'text-gray-400'}">
                          {jadwal.totalHadir > 0 ? `${jadwal.totalHadir}/${totalUserDiDatabase}` : '-'}
                        </p>
                        <p>{jadwal.statusTanggal}</p>
                        <p>{jadwal.statusWaktu}</p>
                      </div>
                    </div>
                  </div>

                  <button 
                    disabled={jadwal.isDisabled}
                    on:click={() => bukaDetailAbsen(jadwal)}
                    class="w-full py-3.5 text-sm font-bold rounded-xl transition-colors
                      {jadwal.isDisabled 
                        ? 'bg-gray-300 text-gray-100 cursor-not-allowed' 
                        : 'bg-[#0a2e52] text-white shadow-md hover:bg-blue-900 cursor-pointer'}"
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

        {:else}
          
          <div class="space-y-6 animate-fade-in">
            <button on:click={tutupDetailAbsen} class="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-600 transition-colors bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Kembali
            </button>

            <div>
              <h2 class="text-2xl font-black text-gray-800">
                [{selectedJadwal.minggu}] - {selectedJadwal.judul}
              </h2>
              <p class="mt-2 text-sm font-medium text-gray-500">
                {selectedJadwal.waktu}
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
                      <th class="px-6 py-4">Status</th>
                      <th class="px-6 py-4 text-center">Lihat Absen</th>
                    </tr>
                  </thead>
                  <tbody class="text-sm text-gray-700">
                    {#each detailSiswaAbsen as siswa}
                      <tr class="transition-colors border-b border-gray-50 hover:bg-gray-50/50">
                        <td class="px-6 py-4 font-medium text-gray-900">{siswa.nama}</td>
                        <td class="px-6 py-4">
                          <div class="flex items-center gap-2 font-medium">
                            <span class={`w-2.5 h-2.5 rounded-full ${siswa.status === 'Sudah Absen' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                            {siswa.status}
                          </div>
                        </td>
                        <td class="px-6 py-4 text-center">
                          <button 
                            disabled={siswa.btnLihatDisabled}
                            on:click={() => openLihatModal(siswa)} class={`px-5 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                              siswa.btnLihatDisabled 
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                                : 'bg-[#0a2e52] text-white hover:bg-blue-900 shadow-sm'
                            }`}
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
{#if isAddJadwalModalOpen}
  <div class="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 w-screen h-screen animate-fade-in">
    
    <div class="absolute inset-0 cursor-pointer bg-black/50 backdrop-blur-sm" on:click={closeAddJadwalModal} aria-hidden="true"></div>

    <div class="relative flex flex-col w-full max-w-lg shadow-2xl bg-white rounded-xl z-10">
      
      <div class="flex items-center justify-between p-6 bg-white border-b border-gray-100 rounded-t-xl">
        <h2 class="text-xl font-extrabold text-gray-800">Buat Jadwal Absen</h2>
        <button on:click={closeAddJadwalModal} class="flex items-center justify-center w-8 h-8 text-white transition-colors shadow-sm bg-[#0a2e52] hover:bg-red-600 rounded-md">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div class="p-6 space-y-4">
        
        <div class="relative group">
          <label class="absolute z-10 font-bold text-gray-700 transition-all duration-200 left-4 top-2 text-[11px]">
            Minggu Ke-
          </label>
          <input
            type="text"
            bind:value={formJadwal.minggu}
            placeholder="Contoh: Week 3"
            class="w-full pt-6 pb-2 pl-4 pr-10 text-sm font-bold text-gray-800 transition-all duration-200 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0a2e52]/20 focus:border-[#0a2e52]"
          />
        </div>

        <div class="relative group">
          <label class="absolute z-10 font-bold text-gray-700 transition-all duration-200 left-4 top-2 text-[11px]">
            Judul Agenda
          </label>
          <input
            type="text"
            bind:value={formJadwal.judul}
            placeholder="Contoh: Evaluasi Scrimmage"
            class="w-full pt-6 pb-2 pl-4 pr-10 text-sm font-bold text-gray-800 transition-all duration-200 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0a2e52]/20 focus:border-[#0a2e52]"
          />
        </div>

        <div class="relative group">
          <label class="absolute z-10 font-bold text-gray-700 transition-all duration-200 left-4 top-2 text-[11px]">
            Tanggal Pelaksanaan
          </label>
          <input
            type="date"
            bind:value={formJadwal.tanggal}
            class="w-full pt-6 pb-2 pl-4 pr-4 text-sm font-bold text-gray-800 transition-all duration-200 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0a2e52]/20 focus:border-[#0a2e52]"
          />
        </div>

        <div class="flex gap-4">
          <div class="relative group flex-1">
            <label class="absolute z-10 font-bold text-gray-700 transition-all duration-200 left-4 top-2 text-[11px]">
              Jam Mulai
            </label>
            <input
              type="time"
              bind:value={formJadwal.jamMulai}
              class="w-full pt-6 pb-2 pl-4 pr-4 text-sm font-bold text-gray-800 transition-all duration-200 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0a2e52]/20 focus:border-[#0a2e52]"
            />
          </div>
          <div class="relative group flex-1">
            <label class="absolute z-10 font-bold text-gray-700 transition-all duration-200 left-4 top-2 text-[11px]">
              Jam Selesai
            </label>
            <input
              type="time"
              bind:value={formJadwal.jamSelesai}
              class="w-full pt-6 pb-2 pl-4 pr-4 text-sm font-bold text-gray-800 transition-all duration-200 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0a2e52]/20 focus:border-[#0a2e52]"
            />
          </div>
        </div>

      </div>

      <div class="flex justify-end gap-3 p-6 bg-gray-50 border-t border-gray-100 rounded-b-xl">
        <button on:click={closeAddJadwalModal} class="px-6 py-2.5 font-bold text-white transition-colors bg-[#e11d48] rounded-lg shadow-sm hover:bg-red-700">
          Cancel
        </button>
        <button on:click={submitJadwalAbsen} class="px-6 py-2.5 font-bold text-white transition-colors bg-[#0a2e52] rounded-lg shadow-sm hover:bg-blue-900">
          Buat Jadwal
        </button>
      </div>

    </div>
  </div>
{/if}
{#if isLihatModalOpen && selectedSiswaDetail && selectedJadwal}
  <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 w-screen h-screen animate-fade-in">
    
    <div class="absolute inset-0 cursor-pointer bg-black/60 backdrop-blur-sm" on:click={closeLihatModal} aria-hidden="true"></div>

    <div class="relative flex flex-col w-full max-w-xl bg-white shadow-2xl rounded-2xl">
      
      <button on:click={closeLihatModal} class="absolute flex items-center justify-center w-8 h-8 text-white transition-colors bg-[#0a2e52] hover:bg-red-600 rounded-md shadow-sm top-6 right-6 z-10">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>

      <div class="p-8 md:p-10 space-y-8 overflow-y-auto max-h-[90vh] no-scrollbar">
        
        <div>
          <h2 class="text-lg font-extrabold text-gray-800 pr-10">
            [{selectedJadwal.minggu}] - {selectedJadwal.judul}
          </h2>
          <p class="mt-1 text-xs font-medium text-gray-500">
            {selectedJadwal.waktu}
          </p>
        </div>

        <div class="flex items-center gap-4">
          <span class="text-[3.5rem] leading-none drop-shadow-sm">
            {selectedSiswaDetail.jawaban.moodEmoji}
          </span>
          <div class="flex flex-col">
            <span class="text-sm font-extrabold text-gray-800">{selectedSiswaDetail.jawaban.moodText}</span>
            <span class="text-[11px] font-semibold text-gray-400">{selectedSiswaDetail.jawaban.tanggal}</span>
          </div>
        </div>

        <div class="space-y-1.5">
          <h4 class="text-sm font-extrabold text-gray-800">Apa yang kamu pelajari?</h4>
          <p class="text-sm font-medium leading-relaxed text-gray-500">
            {selectedSiswaDetail.jawaban.pelajaran}
          </p>
        </div>

        <div class="space-y-3">
          <h4 class="text-sm font-extrabold text-gray-800">Bukti</h4>
          
          <div class="flex items-center justify-center w-full bg-gray-50 border border-gray-200 border-dashed rounded-xl h-44">
            <div class="flex flex-col items-center gap-2 text-gray-400">
              <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <span class="text-xs font-semibold">Lampiran Gambar dari Siswa</span>
            </div>
          </div>
          
        </div>

      </div>
    </div>
  </div>
{/if}