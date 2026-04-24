<script>
  import { push } from "svelte-spa-router";
  import { onMount } from "svelte";
  import Swal from "sweetalert2";

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


  let jadwalList = [
    { event: "Tournament AI", team: "Team A", waktu: "01-01-0001", lokasi: "Tangerang", tipe: "Tournament", status: "Selesai" },
    { event: "Scrim smk 10", team: "Team A\nTeam B", waktu: "01-02-0001", lokasi: "Tangerang", tipe: "Scrim", status: "In 1 days" },
  ];

  let teamOptions = ["Team A", "Team B", "Team C"];
  let tipeOptions = ["Tournament", "Scrim"];

  $: statistik = {
    jadwalTournament: jadwalList.filter(j => j.tipe === "Tournament").length,
    jadwalScrim: jadwalList.filter(j => j.tipe === "Scrim").length,
    jumlahTeam: [...new Set(jadwalList.flatMap(j => j.team.split("\n")))].length,
  };

  // Modal state
  let isModalOpen = false;
  let formData = { namaAcara: "", tanggalAcara: "", lokasi: "", team: "", tipe: "" };

  function openModal() { isModalOpen = true; }
  function closeModal() {
    isModalOpen = false;
    formData = { namaAcara: "", tanggalAcara: "", lokasi: "", team: "", tipe: "" };
  }

  function handleSubmit() {
    if (!formData.namaAcara || !formData.tanggalAcara || !formData.lokasi || !formData.team || !formData.tipe) {
      Swal.fire({ icon: "warning", title: "Lengkapi semua field!", confirmButtonColor: "#0a4682" });
      return;
    }
    jadwalList = [...jadwalList, {
      event: formData.namaAcara,
      team: formData.team,
      waktu: formData.tanggalAcara,
      lokasi: formData.lokasi,
      tipe: formData.tipe,
      status: "Upcoming"
    }];
    Swal.fire({ icon: "success", title: "Jadwal berhasil dibuat!", confirmButtonColor: "#0a4682" });
    closeModal();
  }

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
            <h3 class="text-4xl font-black text-gray-800">{statistik.jadwalTournament}</h3>
            <p class="mt-1 text-sm font-medium text-gray-500">Jadwal Tournament</p>
          </div>

          <div class="flex flex-col justify-center p-5 bg-white border border-gray-100 shadow-sm sm:p-6 rounded-2xl">
            <div class="flex items-center justify-center w-12 h-12 mb-4 text-green-700 bg-green-100 rounded-xl">
              <svg class="w-6 h-6"  viewBox="0 0 2048 2048">
                <path fill="#46a46a" d="M1792 993q60 41 107 93t81 114t50 131t18 141q0 119-45 224t-124 183t-183 123t-224 46q-91 0-176-27t-156-78t-126-122t-85-157H128V128h256V0h128v128h896V0h128v128h256v865zM256 256v256h1408V256h-128v128h-128V256H512v128H384V256H256zm643 1280q-3-31-3-64q0-86 24-167t73-153h-97v-128h128v86q41-51 91-90t108-67t121-42t128-15q100 0 192 33V640H256v896h643zm573 384q93 0 174-35t142-96t96-142t36-175q0-93-35-174t-96-142t-142-96t-175-36q-93 0-174 35t-142 96t-96 142t-36 175q0 93 35 174t96 142t142 96t175 36zm64-512h192v128h-320v-384h128v256zM384 1024h128v128H384v-128zm256 0h128v128H640v-128zm0-256h128v128H640V768zm0 512h128v128H640v-128zm384-384H896V768h128v128zm256 0h-128V768h128v128zM384 768h128v128H384V768z"/>
              </svg>
            </div>
            <h3 class="text-4xl font-black text-gray-800">{statistik.jadwalScrim}</h3>
            <p class="mt-1 text-sm font-medium text-gray-500">Jadwal Scrim</p>
          </div>

          <div class="flex flex-col justify-center p-5 bg-white border border-gray-100 shadow-sm sm:p-6 rounded-2xl sm:col-span-2 lg:col-span-1">
            <div class="flex items-center justify-center w-12 h-12 mb-4 text-green-700 bg-green-100 rounded-xl">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 class="text-4xl font-black text-gray-800">{statistik.jumlahTeam}</h3>
            <p class="mt-1 text-sm font-medium text-gray-500">Jumlah Team</p>
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

          <div class="hidden overflow-x-auto sm:block max-h-[400px]">
            <table class="w-full text-left border-collapse">
              <thead class="sticky top-0 z-10 bg-gray-50 outline outline-1 outline-gray-100">
                <tr class="text-sm text-gray-500 border-b border-gray-100 bg-gray-50">
                  <th class="px-6 py-4 font-semibold">Event</th>
                  <th class="px-6 py-4 font-semibold">Team</th>
                  <th class="px-6 py-4 font-semibold">Waktu</th>
                  <th class="px-6 py-4 font-semibold">Lokasi</th>
                  <th class="px-6 py-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody class="text-sm text-gray-700">
                {#each jadwalList as jadwal}
                  <tr class="transition-colors border-b border-gray-50 hover:bg-gray-50/50">
                    <td class="px-6 py-4 font-medium text-gray-900">{jadwal.event}</td>
                    <td class="px-6 py-4 whitespace-pre-line">{jadwal.team}</td>
                    <td class="px-6 py-4">{jadwal.waktu}</td>
                    <td class="px-6 py-4">{jadwal.lokasi}</td>
                    <td class="px-6 py-4">
                      <span class="inline-flex items-center px-3 py-1 text-xs font-bold rounded-full {jadwal.status === 'Selesai' ? 'bg-gray-200 text-gray-600' : jadwal.status === 'Upcoming' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}">
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
                  <span class="inline-flex items-center px-2.5 py-0.5 text-xs font-bold rounded-full {jadwal.status === 'Selesai' ? 'bg-gray-200 text-gray-600' : jadwal.status === 'Upcoming' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}">
                    {jadwal.status}
                  </span>
                </div>
                <div class="space-y-1 text-xs text-gray-600">
                  <p><span class="font-semibold">Team:</span> {jadwal.team}</p>
                  <p><span class="font-semibold">Waktu:</span> {jadwal.waktu}</p>
                  <p><span class="font-semibold">Lokasi:</span> {jadwal.lokasi}</p>
                </div>
              </div>
            {/each}
          </div>
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
            <label for="lokasi" class="block mb-1.5 text-sm font-semibold text-gray-700">Lokasi</label>
            <input
              id="lokasi"
              type="text"
              bind:value={formData.lokasi}
              class="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="Masukkan lokasi"
            />
          </div>

          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label for="team" class="block mb-1.5 text-sm font-semibold text-gray-700">Team</label>
              <select
                id="team"
                bind:value={formData.team}
                class="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white appearance-none cursor-pointer"
              >
                <option value="" disabled selected>Pilih Team</option>
                {#each teamOptions as team}
                  <option value={team}>{team}</option>
                {/each}
              </select>
            </div>

            <div>
              <label for="tipe" class="block mb-1.5 text-sm font-semibold text-gray-700">Tipe</label>
              <select
                id="tipe"
                bind:value={formData.tipe}
                class="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white appearance-none cursor-pointer"
              >
                <option value="" disabled selected>Pilih Tipe</option>
                {#each tipeOptions as tipe}
                  <option value={tipe}>{tipe}</option>
                {/each}
              </select>
            </div>
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