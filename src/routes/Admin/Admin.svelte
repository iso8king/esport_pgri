<script>
  import { push } from "svelte-spa-router";
  import { onMount } from "svelte";
  import Swal from "sweetalert2";


  let anggotaList = [
    { nama: "Ahmad Jack", team: "Team A", role: "Captain", position: "Mid Laner", status: "Active" },
    { nama: "Udin Petot", team: "Team B", role: "Player", position: "Gold Laner", status: "Active" },
    { nama: "Siti Pro", team: "Team A", role: "Player", position: "Jungler", status: "Active" },
    { nama: "Bambang back", team: "No Team", role: "Player", position: "Roamer", status: "Active" },
    { nama: "Ahmad Jack", team: "Team A", role: "Player", position: "Mid Laner", status: "Active" },
    { nama: "Udin Petot", team: "Team B", role: "Player", position: "Gold Laner", status: "Active" },
    { nama: "Siti Pro", team: "Team A", role: "Coach", position: "Jungler", status: "Active" },
    { nama: "Bambang back", team: "No Team", role: "Player", position: "Roamer", status: "In-Active" },
  ];

  $: statistik = {
    totalanggota : anggotaList.length,

      playerAktif: anggotaList.filter(
      orang => (orang.role === "Player" || orang.role === "Captain") && orang.status === "Active"
    ).length,

    playerInAktif: anggotaList.filter(
      orang => (orang.role === "Player" || orang.role === "Captain") && orang.status === "In-Active"
    ).length,
    
    coachAktif: anggotaList.filter(
      orang => orang.role === "Coach" && orang.status === "Active"
    ).length,

    teamAktif: [...new Set(anggotaList.map(orang => orang.team))]
      .filter(namaTim => namaTim !== "No Team").length
  };

  const urutanRole = {
    "Coach": 1,
    "Captain": 2,
    "Player": 3
  };
  $: Datatim = anggotaList.reduce((hasil, anggota) =>{
  let cektim = hasil.find(team => team.name === anggota.team);
  if(!cektim) {
    cektim =  {
      name: anggota.team,
      members: []
    };
    hasil.push(cektim);
  }
  cektim.members.push({
    name: anggota.nama,
    role: anggota.role,
  });
  return hasil;
}, []).map(team => {
    team.members.sort((a, b) => {
      
      let nilaiA = urutanRole[a.role] || 99;
      let nilaiB = urutanRole[b.role] || 99;
      
      return nilaiA - nilaiB;
    });

  return team;
});

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

  let isTeamModalOpen = false;
  let activeAccordion = "";

  function toggleTeamModal() {
    isTeamModalOpen = !isTeamModalOpen;
  }

  function toggleAccordion(teamName) {
    activeAccordion = activeAccordion === teamName ? null : teamName;
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
        class="flex items-center w-full gap-3 px-4 py-2.5 text-sm font-medium text-white transition-colors rounded-lg bg-white/10">
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
                window.location.href = '#/admin/settings';
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

    <main class="flex-1 p-8 overflow-x-hidden overflow-y-auto bg-gray-50">
      <div class="max-w-6xl mx-auto space-y-6">
        
        <div class="relative p-8 overflow-hidden text-white shadow-lg bg-gradient-to-r from-[#0a4682] to-[#126bc2] rounded-2xl">
          <div class="relative z-10">
            <h2 class="mb-2 text-sm font-bold tracking-widest text-blue-100 uppercase">Jumlah Anggota Saat Ini</h2>
            <div class="flex items-baseline gap-3 mb-6">
              <span class="text-7xl font-black">{statistik.totalanggota}</span>
              <span class="text-2xl font-bold">Anggota</span>
            </div>
            <button
              on:click={toggleTeamModal}
              class="px-6 py-2 font-bold transition-colors bg-white rounded-lg shadow-md text-[#0a4682] hover:bg-blue-50">
              Lihat Team
            </button>
          </div>
          <div class="absolute w-64 h-64 bg-white rounded-full opacity-5 -right-10 -top-20 blur-2xl pointer-events-none"></div>
        </div>

        <div class="grid grid-cols-1 gap-6 md:grid-cols-4">
          <div class="flex flex-col justify-center p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
            <div class="flex items-center justify-center w-12 h-12 mb-4 text-green-700 bg-green-100 rounded-xl">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 class="text-4xl font-black text-gray-800">{statistik.playerAktif}</h3>
            <p class="mt-1 text-sm font-medium text-gray-500">Player Aktif</p>
          </div>
          
          <div class="flex flex-col justify-center p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
            <div class="flex items-center justify-center w-12 h-12 mb-4 text-red-700 bg-red-100 rounded-xl">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 class="text-4xl font-black text-gray-800">{statistik.playerInAktif}</h3>
            <p class="mt-1 text-sm font-medium text-gray-500">Player In-Aktif</p>
          </div>

          <div class="flex flex-col justify-center p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
            <div class="flex items-center justify-center w-12 h-12 mb-4 text-green-700 bg-green-100 rounded-xl">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 class="text-4xl font-black text-gray-800">{statistik.coachAktif}</h3>
            <p class="mt-1 text-sm font-medium text-gray-500">Coach Aktif</p>
          </div>

          <div class="flex flex-col justify-center p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
            <div class="flex items-center justify-center w-12 h-12 mb-4 text-green-700 bg-green-100 rounded-xl">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 class="text-4xl font-black text-gray-800">{statistik.teamAktif}</h3>
            <p class="mt-1 text-sm font-medium text-gray-500">Team Aktif</p>
          </div>
        </div>

        <div class="overflow-hidden bg-white border border-gray-100 shadow-sm rounded-2xl">
          <div class="px-6 py-5 border-b border-gray-100">
            <h3 class="text-lg font-bold text-gray-800">Anggota</h3>
          </div>

          <div class="overflow-x-auto max-h-[400px]">
            <table class="w-full text-left border-collapse ">
              <thead class="sticky top-0 z-10 bg-gray-50 outline outline-1 outline-gray-100">
                <tr class="text-sm text-gray-500 border-b border-gray-100 bg-gray-50">
                  <th class="px-6 py-4 font-semibold">Nama</th>
                  <th class="px-6 py-4 font-semibold">Team</th>
                  <th class="px-6 py-4 font-semibold">Role</th>
                  <th class="px-6 py-4 font-semibold">Position</th>
                  <th class="px-6 py-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody class="text-sm text-gray-700">
                {#each anggotaList as orang}
                  <tr class="transition-colors border-b border-gray-50 hover:bg-gray-50/50">
                    <td class="px-6 py-4 font-medium text-gray-900">{orang.nama}</td>
                    <td class="px-6 py-4">{orang.team}</td>
                    <td class="px-6 py-4">{orang.role}</td>
                    <td class="px-6 py-4">{orang.position}</td>
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-2">
                        <span class={`w-2 h-2 rounded-full ${orang.status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        {orang.status}
                      </div>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  </div>

  {#if isTeamModalOpen}
    <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div
        class="absolute inset-0 cursor-pointer bg-black/40 backdrop-blur-sm"
        on:click={toggleTeamModal}
        aria-hidden="true"
      ></div>

      <div class="relative flex flex-col w-full max-w-2xl shadow-2xl bg-[#f8fafc] rounded-xl max-h-[90vh]">
        
        <div class="flex items-center justify-between p-6 bg-white border-b border-gray-100 rounded-t-xl">
          <h2 class="text-xl font-extrabold text-gray-800">Komposisi Team</h2>
          <button
            on:click={toggleTeamModal}
            class="flex items-center justify-center w-8 h-8 text-white transition-colors shadow-sm bg-[#0a2e52] hover:bg-red-600 rounded-md"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="p-6 space-y-4 overflow-y-auto">
          {#each Datatim as team}
            <div class="overflow-hidden transition-all duration-300 bg-white border border-gray-200 shadow-sm rounded-2xl">
              
              <button
                on:click={() => toggleAccordion(team.name)}
                class="flex items-center justify-between w-full p-5 transition-colors bg-white hover:bg-gray-50 focus:outline-none"
              >
                <span class="text-xl font-bold text-gray-800">{team.name}</span>
                <svg
                  class="w-5 h-5 transition-transform duration-300 {activeAccordion === team.name ? 'rotate-180 text-red-500' : 'text-gray-400'}"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {#if activeAccordion === team.name}
                <div class="px-6 pt-2 pb-5 bg-white border-t border-gray-100 animate-fade-in-down">
                  {#each team.members as member}
                    <div class="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                      <span class="pl-2 text-sm font-medium text-gray-600">{member.name}</span>
                      <span class="pr-2 text-sm font-bold text-gray-800">{member.role}</span>
                    </div>
                  {/each}
                </div>
              {/if}

            </div>
          {/each}
        </div>
      </div>
    </div>
  {/if}
</div>
