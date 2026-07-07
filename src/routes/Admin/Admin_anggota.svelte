<script>
  import { push } from "svelte-spa-router";
  import { onMount } from "svelte";
  import Swal from "sweetalert2";
  import {fetchWithAuth} from "$lib/auth.js"

  // State untuk menyimpan data anggota dari backend
  let anggotaList = [];
  let isLoading = true; 
  let errorMessage = ""; 
  let teamList = [];

  let userAvatar = `/avatar/${localStorage.getItem("user_avatar")}`;
  
  // API URL
  const API_URL = "/api/users/all";
  const TEAMS_API_URL = "/api/teams";
  const STATISTIK_API_URL = "/api/statistik";
  
  let searchQuery = '';
  let selectedTeamFilter = '';
  let selectedRoleFilter = '';

  // State untuk Manage Team
  let isManageTeamModalOpen = false;
  let isEditingTeam = false;
  let editingTeamId = null;
  let editingTeamName = '';
  let newTeamName = '';
  let isSubmittingTeam = false;

  // Filter anggota berdasarkan pencarian, team, dan role
  $: filterAnggotaList = anggotaList.filter((orang) => {
    const matchName = orang.nama.toLowerCase().includes(searchQuery.toLowerCase());
    const matchTeam = selectedTeamFilter === '' || orang.team === selectedTeamFilter;
    const matchRole = selectedRoleFilter === '' || orang.position === selectedRoleFilter;
    return matchName && matchTeam && matchRole;
  });

  // Statistik
  let statistik = {
    totalanggota: 0,
    playerDalamTeam: 0,
    playerTidakDalamTeam: 0,
    teamAktif: 0,
  };

  let currentUserName = "Loading...";

  function mapRoleToFrontend(role) {
    if (!role) return null;
    const roleMap = {
      'gold': 'Gold Lane',
      'exp': 'Exp Lane',
      'mid': 'Mid Lane',
      'jungle': 'Jungle',
      'roam': 'Roam'
    };
    return roleMap[role.toLowerCase()] || role;
  }

  function mapRoleToBackend(role) {
    if (!role) return null;
    const roleMap = {
      'Gold Lane': 'gold',
      'Exp Lane': 'exp',
      'Mid Lane': 'mid',
      'Jungle': 'jungle',
      'Roam': 'roam'
    };
    return roleMap[role] || role.toLowerCase();
  }

  // Fetch list team dari backend
  async function fetchTeamList() {
    try {
      const response = await fetchWithAuth(`${TEAMS_API_URL}/all`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      teamList = result.data || [];
      console.log("Team list:", teamList);
    } catch (error) {
      console.error("Error fetching team list:", error);
      teamList = [];
    }
  }

  // Fetch statistik dari backend
  async function fetchStatistik() {
    try {
      const response = await fetchWithAuth(STATISTIK_API_URL, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      
      if (result.data) {
        statistik = {
          totalanggota: result.data.allUser || 0,
          playerDalamTeam: result.data.onTeam || 0,
          playerTidakDalamTeam: result.data.notOnTeam || 0,
          teamAktif: result.data.teamCount || teamList.length,
        };
      }
    } catch (error) {
      console.error("Error fetching statistik:", error);
    }
  }

  // FETCH ANGGOTA
  async function fetchAnggota() {
    isLoading = true;
    errorMessage = "";
    try {
      const response = await fetchWithAuth(API_URL, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      console.log("Response API:", result);
      
      const users = result.data || [];
      
      anggotaList = users.map(user => {
        const hasTeam = user.member !== null && user.member !== undefined && user.member.team !== null;
        
        let teamName = "No Team";
        let roleFrontend = "Belum Assign";
        let status = "Tidak Dalam Tim";
        
        if (hasTeam && user.member.team) {
          teamName = user.member.team.nama_tim || "No Team";
          status = "Dalam Tim";
          
          if (user.member.role) {
            roleFrontend = mapRoleToFrontend(user.member.role) || "Belum Assign";
          }
        }
        
        let teamId = null;
        if (teamName !== "No Team") {
          const foundTeam = teamList.find(t => t.nama_tim === teamName);
          teamId = foundTeam ? foundTeam.id : null;
        }
        
        return {
          userId: user.id,
          nama: user.nama,
          username: user.username,
          team: teamName,
          teamId: teamId,
          position: roleFrontend,
          status: status,
        };
      });
      
      console.log("Anggota list:", anggotaList);
      
      const dalamTim = anggotaList.filter(a => a.status === "Dalam Tim").length;
      const tidakDalamTim = anggotaList.filter(a => a.status === "Tidak Dalam Tim").length;
      const uniqueTeams = [...new Set(anggotaList.filter(a => a.team !== "No Team").map(a => a.team))];
      
      statistik = {
        totalanggota: anggotaList.length,
        playerDalamTeam: dalamTim,
        playerTidakDalamTeam: tidakDalamTim,
        teamAktif: uniqueTeams.length
      };
      
    } catch (error) {
      console.error("Error fetching anggota:", error);
      errorMessage = "Gagal memuat data anggota. Silakan coba lagi.";
      Swal.fire({ icon: 'error', title: 'Gagal Memuat Data', text: errorMessage, confirmButtonColor: '#0b5ba2' });
    } finally {
      isLoading = false;
    }
  }

  async function removeFromTeam(userId, teamId, userName, teamName) {
    if (!teamId) {
      Swal.fire({ 
        icon: 'error', 
        title: 'Gagal!', 
        text: `ID Tim tidak ditemukan untuk ${teamName}. Silakan refresh halaman.`, 
        confirmButtonColor: "#ef4444" 
      });
      return;
    }
    
    const result = await Swal.fire({
      title: "Hapus dari Tim?",
      text: `Apakah Anda yakin ingin menghapus ${userName} dari tim ${teamName}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#9ca3af",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal"
    });
    if (!result.isConfirmed) return;
    
    try {
      const response = await fetchWithAuth(`${TEAMS_API_URL}/${teamId}/remove?userId=${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) throw new Error("Gagal menghapus anggota dari tim");
      
      Swal.fire({ icon: "success", title: "Berhasil!", text: `${userName} berhasil dihapus dari tim ${teamName}`, timer: 1500, showConfirmButton: false });
      
      await fetchTeamList();
      await fetchAnggota();
      await fetchStatistik();
      
    } catch (error) {
      console.error("Error removing member:", error);
      Swal.fire({ icon: "error", title: "Gagal!", text: error.message || "Gagal menghapus anggota dari tim.", confirmButtonColor: "#ef4444" });
    }
  }

  async function submitEditAnggota() {
    if (!formData.nama || !formData.team || !formData.position) {
      Swal.fire({ icon: "warning", title: "Data Belum Lengkap", text: "Pastikan semua pilihan telah diisi!" });
      return;
    }

    if (formData.team === originalFormData.team && formData.position === originalFormData.position) {
      Swal.fire({
        icon: "info",
        title: "Tidak Ada Perubahan",
        text: "Tidak ada data yang diubah untuk disimpan.",
        confirmButtonColor: "#0b5ba2"
      });
      return;
    }

    try {
      if (formData.team === "No Team") {
        Swal.fire({ icon: "info", title: "Info", text: "Fitur hapus dari team akan segera tersedia." });
        closeEditModal();
        return;
      }
      
      const selectedTeam = teamList.find(team => team.nama_tim === formData.team);
      if (!selectedTeam) throw new Error("Team tidak ditemukan");
      
      const backendRole = mapRoleToBackend(formData.position);
      const bodyData = { userId: formData.userId, role: backendRole };
      
      const response = await fetchWithAuth(`${TEAMS_API_URL}/${selectedTeam.id}/add`, {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify(bodyData)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.errors || "Gagal update data");
      }
      
      closeEditModal();
      Swal.fire({ icon: "success", title: "Berhasil!", text: `Anggota berhasil ditambahkan ke team ${formData.team} dengan role ${formData.position}`, timer: 1500, showConfirmButton: false });
      
      await fetchTeamList();
      await fetchAnggota();
      await fetchStatistik();
      
    } catch (error) {
      console.error("Error updating anggota:", error);
      Swal.fire({ icon: "error", title: "Gagal!", text: error.message || "Gagal memperbarui data.", confirmButtonColor: "#ef4444" });
    }
  }

  async function submitTeam() {
    if (!namaTeam) {
      Swal.fire({ icon: "warning", title: "Data Belum Lengkap", text: "Pastikan semua pilihan telah diisi!" });
      return;
    }
    try {
      const response = await fetchWithAuth(`${TEAMS_API_URL}/create?nama_tim=${encodeURIComponent(namaTeam)}`, {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) throw new Error("Gagal menambah team");
      
      closeModal();
      Swal.fire({ icon: "success", title: "Berhasil!", text: `Team berhasil ditambahkan.`, timer: 1500, showConfirmButton: false });
      
      await fetchTeamList();
      await fetchStatistik();
      
    } catch (error) {
      console.error("Error adding team:", error);
      Swal.fire({ icon: "error", title: "Gagal!", text: "Gagal menambahkan team. Silakan coba lagi.", confirmButtonColor: "#ef4444" });
    }
  }

  
  function openManageTeamModal() {
    isManageTeamModalOpen = true;
    isEditingTeam = false;
    editingTeamId = null;
    editingTeamName = '';
    newTeamName = '';
  }

  function closeManageTeamModal() {
    isManageTeamModalOpen = false;
    isEditingTeam = false;
    editingTeamId = null;
    editingTeamName = '';
    newTeamName = '';
  }

  function startEditTeam(team) {
    isEditingTeam = true;
    editingTeamId = team.id;
    editingTeamName = team.nama_tim;
    newTeamName = team.nama_tim;
  }

  async function deleteTeam(teamId, teamName) {
    const result = await Swal.fire({
      title: "Hapus Team?",
      text: `Apakah Anda yakin ingin menghapus team "${teamName}"? Semua anggota dalam team ini akan kehilangan team.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#9ca3af",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal"
    });
    
    if (!result.isConfirmed) return;
    
    try {
      const response = await fetchWithAuth(`${TEAMS_API_URL}/${teamId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.errors || "Gagal menghapus team");
      }
      
      Swal.fire({ 
        icon: "success", 
        title: "Berhasil!", 
        text: `Team "${teamName}" berhasil dihapus.`, 
        timer: 1500, 
        showConfirmButton: false 
      });
      
      await fetchTeamList();
      await fetchAnggota();
      await fetchStatistik();
      
      // Refresh manage team modal list
      if (isManageTeamModalOpen) {
        // Trigger re-render
        isManageTeamModalOpen = false;
        setTimeout(() => {
          isManageTeamModalOpen = true;
        }, 100);
      }
      
    } catch (error) {
      console.error("Error deleting team:", error);
      Swal.fire({ 
        icon: "error", 
        title: "Gagal!", 
        text: error.message || "Gagal menghapus team. Silakan coba lagi.", 
        confirmButtonColor: "#ef4444" 
      });
    }
  }

  async function updateTeamName() {
    if (!newTeamName.trim()) {
      Swal.fire({ 
        icon: "warning", 
        title: "Nama Team Kosong", 
        text: "Silakan masukkan nama team yang baru.", 
        confirmButtonColor: "#ef4444" 
      });
      return;
    }
    
    if (newTeamName.trim() === editingTeamName) {
      Swal.fire({ 
        icon: "info", 
        title: "Tidak Ada Perubahan", 
        text: "Nama team masih sama dengan sebelumnya.", 
        confirmButtonColor: "#0b5ba2" 
      });
      return;
    }
    
    isSubmittingTeam = true;
    
    try {
      const response = await fetchWithAuth(`${TEAMS_API_URL}/${editingTeamId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ nama_tim: newTeamName.trim() })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.errors || "Gagal mengupdate team");
      }
      
      Swal.fire({ 
        icon: "success", 
        title: "Berhasil!", 
        text: `Team berhasil diupdate menjadi "${newTeamName.trim()}".`, 
        timer: 1500, 
        showConfirmButton: false 
      });
      
      isEditingTeam = false;
      editingTeamId = null;
      editingTeamName = '';
      newTeamName = '';
      
      await fetchTeamList();
      await fetchAnggota();
      await fetchStatistik();
      
      // Refresh manage team modal list
      if (isManageTeamModalOpen) {
        isManageTeamModalOpen = false;
        setTimeout(() => {
          isManageTeamModalOpen = true;
        }, 100);
      }
      
    } catch (error) {
      console.error("Error updating team:", error);
      Swal.fire({ 
        icon: "error", 
        title: "Gagal!", 
        text: error.message || "Gagal mengupdate team. Silakan coba lagi.", 
        confirmButtonColor: "#ef4444" 
      });
    } finally {
      isSubmittingTeam = false;
    }
  }

  function cancelEditTeam() {
    isEditingTeam = false;
    editingTeamId = null;
    editingTeamName = '';
    newTeamName = '';
  }

  function resetFilters() {
    searchQuery = '';
    selectedTeamFilter = '';
    selectedRoleFilter = '';
  }

  onMount(async () => {
    const name = localStorage.getItem("user_name");
    if (name) currentUserName = name;
    else push("/");
    
    if (localStorage.getItem("role") !== "admin") {
      Swal.fire({ icon: 'error', title: 'Unauthorized', text: 'Redirecting......', confirmButtonColor: '#0b5ba2' }).then(() => push('/user/absensi'));
      return;
    }
    
    const userStatus = localStorage.getItem("status");
    if (!userStatus) {
      Swal.fire({ icon: 'warning', title: 'Belum Verifikasi', text: 'Redirecting......', confirmButtonColor: '#0b5ba2' }).then(() => push('/verification'));
      return;
    }
    
    await fetchTeamList();
    await Promise.all([fetchAnggota(), fetchStatistik()]);
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
        localStorage.removeItem("token");
        localStorage.removeItem("status");
        localStorage.removeItem("user_id");
        localStorage.removeItem("tim");
        push("/");
      }
    });
  }

  let innerWidth = 0;
  let isSidebarOpen = true;
  let isMobile = false;

  $: {
    isMobile = innerWidth < 768;
    if (isMobile) isSidebarOpen = false;
    else isSidebarOpen = true;
  }

  function toggleSidebar() { isSidebarOpen = !isSidebarOpen; }
  function closeSidebar() { if (isMobile) isSidebarOpen = false; }

  let isDropdownOpen = false;
  function toggleDropdown() { isDropdownOpen = !isDropdownOpen; }
  function closeDropdown() { isDropdownOpen = false; }

  let isModalOpen = false;
  let namaTeam = "";
  function openModal() { isModalOpen = true; }
  function closeModal() { isModalOpen = false; namaTeam = ""; }

  let isEditModalOpen = false;
  let formData = { userId: "", nama: "", team: "", teamId: "", position: "", status: "" };
  let originalFormData = { team: "", position: "" };

  function openEditModal(orang) {
    formData = { 
      userId: orang.userId,
      nama: orang.nama,
      team: orang.team,
      teamId: orang.teamId,
      position: orang.position,
      status: orang.status,
    };
    originalFormData = {
      team: orang.team,
      position: orang.position
    };
    isEditModalOpen = true;
  }
  function closeEditModal() { isEditModalOpen = false; }
</script>

<svelte:window bind:innerWidth />

<div class="flex h-screen overflow-hidden font-sans bg-gray-50">
  
  {#if isSidebarOpen && isMobile}
    <div on:click={closeSidebar} class="fixed inset-0 z-40 transition-opacity bg-black/50 backdrop-blur-sm" aria-hidden="true"></div>
  {/if}

  <aside class="{isSidebarOpen ? 'w-64' : 'w-0'} {isMobile ? 'fixed left-0 top-0 z-50' : 'relative'} overflow-hidden bg-[#0a2e52] text-white flex flex-col h-full shrink-0 shadow-xl transition-all duration-300 whitespace-nowrap">
    <div class="flex items-center justify-between px-6 py-8">
      <div class="flex items-center gap-3">
        <img src="src/assets/logo1.png" alt="logo" class="w-10 h-12 text-white" />
        <span class="text-2xl font-bold tracking-wider">E-Sport</span>
      </div>
      {#if isMobile}
        <button on:click={toggleSidebar} class="p-1 transition-colors rounded-md cursor-pointer bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      {/if}
    </div>

    <nav class="flex-1 px-4 space-y-6 overflow-y-auto">
      <div>
        <p class="flex items-center gap-2 px-2 mb-2 text-xs font-semibold tracking-wider text-gray-400 uppercase">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Dashboard
        </p>
        <button on:click={() => { window.location.href = '#/admin/beranda'; }} class="flex items-center w-full gap-3 px-4 py-2.5 text-sm transition-colors rounded-lg text-gray-300 hover:bg-white/5 hover:text-white">
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
          <button on:click={() => { window.location.href = '#/admin/anggota'; }} class="flex items-center w-full gap-3 px-4 py-2.5 text-sm font-medium text-white transition-colors rounded-lg bg-white/10">
            Anggota
          </button>
          <button on:click={() => { window.location.href = "#/admin/absensi"; }} class="flex items-center w-full gap-3 px-4 py-2.5 text-sm transition-colors rounded-lg text-gray-300 hover:bg-white/5 hover:text-white">
            Absensi
          </button>
          <button on:click={() => { window.location.href = "#/admin/analisis"; }} class="flex items-center w-full gap-3 px-4 py-2.5 text-sm transition-colors rounded-lg text-gray-300 hover:bg-white/5 hover:text-white">
            Analisis
          </button>
          <button on:click={() => { window.location.href = "#/admin/jadwal"; }} class="flex items-center w-full gap-3 px-4 py-2.5 text-sm transition-colors rounded-lg text-gray-300 hover:bg-white/5 hover:text-white">
            Jadwal
          </button>
        </div>
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
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 class="hidden text-base font-bold text-gray-700 md:block">Anggota</h1>
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
          <svg class="w-4 h-4 text-gray-400 transition-transform duration-200 {isDropdownOpen ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>
        </button>

        {#if isDropdownOpen}
          <div class="fixed inset-0 z-40" on:click={closeDropdown} aria-hidden="true"></div>
          <div class="absolute right-0 z-50 w-48 py-2 mt-2 bg-white border border-gray-100 rounded-lg shadow-lg">
            <button on:click={() => { window.location.href = "#/admin/settings"; closeDropdown(); }} class="flex items-center w-full gap-2 px-4 py-2.5 text-sm text-gray-700 transition-colors text-left hover:bg-gray-50">
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

    <main class="flex-1 p-10 overflow-x-hidden overflow-y-auto bg-gray-50">
      <div class="max-w-full mx-auto space-y-7">
        
        {#if isLoading}
          <div class="flex flex-col items-center justify-center py-20">
            <div class="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p class="mt-4 text-gray-600">Memuat data anggota...</p>
          </div>
        {:else if errorMessage}
          <div class="flex flex-col items-center justify-center py-20">
            <svg class="w-16 h-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="mt-4 text-red-600">{errorMessage}</p>
            <button on:click={fetchAnggota} class="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Coba Lagi</button>
          </div>
        {:else}
          <div class="grid grid-cols-1 gap-9 md:grid-cols-3">
            <div class="flex flex-col justify-center p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
              <div class="flex items-center justify-center w-12 h-12 mb-4 text-green-700 bg-green-100 rounded-xl">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 class="text-4xl font-black text-gray-800">{statistik.playerDalamTeam}</h3>
              <p class="mt-1 text-sm font-medium text-gray-500">Player Dalam Tim</p>
            </div>

            <div class="flex flex-col justify-center p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
              <div class="flex items-center justify-center w-12 h-12 mb-4 text-red-700 bg-red-100 rounded-xl">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 class="text-4xl font-black text-gray-800">{statistik.playerTidakDalamTeam}</h3>
              <p class="mt-1 text-sm font-medium text-gray-500">Player Tidak Dalam Tim</p>
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
            <div class="flex flex-col gap-4 px-6 py-5 border-b border-gray-100">
              <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h3 class="text-lg font-bold text-gray-800">Anggota</h3>
                <div class="flex gap-2 w-full sm:w-auto">
                  <button on:click={openManageTeamModal} class="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-white whitespace-nowrap transition-all bg-green-600 rounded-lg shadow-md hover:bg-green-700 hover:shadow-lg active:scale-95 w-full sm:w-auto">

                    Manage Team
                  </button>
                </div>
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input type="text" bind:value={searchQuery} placeholder=" Cari nama anggota..." class="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200" />
                
                <div class="relative">
                  <select bind:value={selectedTeamFilter} class="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 appearance-none cursor-pointer bg-white">
                    <option value="">Semua Team</option>
                    {#each teamList as team}
                      <option value={team.nama_tim}>{team.nama_tim}</option>
                    {/each}
                    <option value="No Team">Tidak Dalam Tim</option>
                  </select>
                  <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
                
                <div class="relative">
                  <select bind:value={selectedRoleFilter} class="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 appearance-none cursor-pointer bg-white">
                    <option value="">Semua Role</option>
                    <option value="Gold Lane">Gold Lane</option>
                    <option value="Exp Lane">Exp Lane</option>
                    <option value="Mid Lane">Mid Lane</option>
                    <option value="Jungle">Jungle</option>
                    <option value="Roam">Roam</option>
                    <option value="Belum Assign">Belum Assign</option>
                  </select>
                  <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
                
                <button on:click={resetFilters} class="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-all">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reset Filter
                </button>
              </div>
              
              <div class="text-sm text-gray-500">Menampilkan {filterAnggotaList.length} dari {anggotaList.length} anggota</div>
            </div>

            <div class="overflow-x-auto max-h-[530px]">
              <table class="w-full text-left border-collapse">
                <thead class="sticky top-0 z-10 outline outline-1 outline-gray-100 bg-gray-50">
                  <tr class="text-sm text-gray-500 border-b border-gray-100 bg-gray-50">
                    <th class="px-6 py-4 font-semibold whitespace-nowrap">Nama</th>
                    <th class="px-6 py-4 font-semibold whitespace-nowrap">Username</th>
                    <th class="px-6 py-4 font-semibold whitespace-nowrap">Team</th>
                    <th class="px-6 py-4 font-semibold whitespace-nowrap">Role</th>
                    <th class="px-6 py-4 font-semibold whitespace-nowrap">Status</th>
                    <th class="px-6 py-4 font-semibold text-center whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody class="text-sm text-gray-700">
                  {#each filterAnggotaList as orang}
                    <tr class="transition-colors border-b border-gray-50 hover:bg-gray-50/50">
                      <td class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{orang.nama}</td>
                      <td class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{orang.username}</td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        {#if orang.team !== "No Team"}
                          <span class="px-3 py-1 text-xs font-bold text-green-800 bg-green-100 rounded-full">{orang.team}</span>
                        {:else}
                          <span class="px-3 py-1 text-xs font-bold text-gray-500 bg-gray-100 rounded-full">Belum Punya Team</span>
                        {/if}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        {#if orang.position && orang.position !== "Belum Assign"}
                          <span class="px-3 py-1 text-xs font-bold text-blue-800 bg-blue-100 rounded-full">{orang.position}</span>
                        {:else}
                          <span class="px-3 py-1 text-xs font-bold text-gray-500 bg-gray-100 rounded-full">Belum Assign</span>
                        {/if}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center gap-2">
                          <span class={`w-2 h-2 rounded-full ${orang.team !== 'No Team' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          {orang.status}
                        </div>
                      </td>
                      <td class="px-6 py-4 text-center whitespace-nowrap">
                        <div class="flex items-center justify-center gap-2">
                          <button on:click={() => openEditModal(orang)} class="p-2 text-blue-600 transition-colors rounded-md hover:bg-blue-50" title="Edit Data">
                            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          {#if orang.team !== "No Team"}
                            <button on:click={() => removeFromTeam(orang.userId, orang.teamId, orang.nama, orang.team)} class="p-2 text-red-600 transition-colors rounded-md hover:bg-red-50" title="Hapus dari Tim">
                              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          {/if}
                        </div>
                      </td>
                    </tr>
                  {/each}
                  
                  {#if filterAnggotaList.length === 0}
                    <tr>
                      <td colspan="6" class="py-8 text-center text-gray-400 whitespace-nowrap">
                        Tidak ada anggota yang cocok dengan filter yang dipilih.
                        <button on:click={resetFilters} class="ml-2 text-blue-600 hover:underline">Reset Filter</button>
                      </td>
                    </tr>
                  {/if}
                </tbody>
              </table>
            </div>
          </div>
        {/if}
      </div>
    </main>
  </div>
</div>

<!-- MODAL BUAT TEAM -->
<!-- {#if isModalOpen}
<div class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
  <div class="absolute inset-0 cursor-pointer bg-black/40 backdrop-blur-sm" on:click={closeModal} aria-hidden="true"></div>
  <div class="relative flex flex-col w-full max-w-md shadow-2xl bg-white rounded-xl">
    <div class="flex items-center justify-between p-5 bg-white border-b border-gray-100 sm:p-6 rounded-t-xl">
      <h3 class="text-lg font-extrabold text-gray-800 sm:text-xl">Buat Team Baru</h3>
      <button on:click={closeModal} class="flex items-center justify-center w-8 h-8 text-white transition-colors shadow-sm bg-[#0a2e52] hover:bg-red-600 rounded-md">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </div>
    <div class="p-5 space-y-4 sm:p-6">
      <label for="namaTeam" class="block mb-2 text-sm font-bold text-gray-700">Nama Team</label>
      <input type="text" id="namaTeam" bind:value={namaTeam} placeholder="Masukkan nama team di sini..." class="w-full px-4 py-2.5 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a4682] focus:bg-white transition-all" />
    </div>
    <div class="flex justify-end gap-3 p-5 bg-gray-50 border-t border-gray-100 sm:p-6 rounded-b-xl">
      <button on:click={closeModal} class="px-6 py-2.5 text-sm font-bold text-white transition-all bg-red-600 rounded-lg shadow-md hover:bg-red-700 active:scale-95">Batal</button>
      <button on:click={submitTeam} class="px-6 py-2.5 text-sm font-bold text-white transition-all bg-[#0a4682] rounded-lg shadow-md hover:bg-[#0c5599] active:scale-95">Submit</button>
    </div>
  </div>
</div>
{/if} -->

<!-- MODAL EDIT ANGGOTA -->
{#if isEditModalOpen}
<div class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
  <div class="absolute inset-0 cursor-pointer bg-black/40 backdrop-blur-sm" on:click={closeEditModal} aria-hidden="true"></div>
  <div class="relative flex flex-col w-full max-w-lg shadow-2xl bg-white rounded-xl">
    <div class="flex items-center justify-between p-5 bg-white border-b border-gray-100 sm:p-6 rounded-t-xl">
      <h2 class="text-lg font-extrabold text-gray-800 sm:text-xl">Edit Anggota</h2>
      <button on:click={closeEditModal} class="flex items-center justify-center w-8 h-8 text-white transition-colors shadow-sm bg-[#0a2e52] hover:bg-red-600 rounded-md">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </div>
    <div class="p-5 space-y-4 sm:p-6">
      <div class="relative group">
        <label class="absolute z-10 font-bold text-gray-700 transition-all duration-200 left-4 top-2 text-[11px]">Nama Anggota</label>
        <input type="text" bind:value={formData.nama} disabled class="w-full pt-6 pb-2 pl-4 pr-10 text-sm font-bold text-gray-500 transition-all duration-200 bg-gray-100 border border-gray-200 rounded-xl shadow-sm cursor-not-allowed" />
      </div>
      <div class="relative group">
        <label class="absolute z-10 font-bold text-gray-700 transition-all duration-200 left-4 top-2 text-[11px] pointer-events-none">Pilih Team</label>
        <select bind:value={formData.team} class="w-full pt-6 pb-2 pl-4 pr-10 text-sm font-bold text-gray-800 transition-all duration-200 bg-white border border-gray-200 rounded-xl shadow-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0a2e52]/20 focus:border-[#0a2e52]">
          <option value="No Team">No Team</option>
          {#each teamList as team}
            <option value={team.nama_tim}>{team.nama_tim}</option>
          {/each}
        </select>
        <div class="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-400">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
        </div>
      </div>
      <div class="relative group">
        <label class="absolute z-10 font-bold text-gray-700 transition-all duration-200 left-4 top-2 text-[11px] pointer-events-none">Pilih Role</label>
        <select bind:value={formData.position} class="w-full pt-6 pb-2 pl-4 pr-10 text-sm font-bold text-gray-800 transition-all duration-200 bg-white border border-gray-200 rounded-xl shadow-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0a2e52]/20 focus:border-[#0a2e52]">
          <option value={null}>Pilih Role</option>
          <option value="Gold Lane">Gold Lane</option>
          <option value="Exp Lane">Exp Lane</option>
          <option value="Mid Lane">Mid Lane</option>
          <option value="Jungle">Jungle</option>
          <option value="Roam">Roam</option>
        </select>
        <div class="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-400">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
        </div>
      </div>
    </div>
    <div class="flex justify-end gap-3 p-5 bg-gray-50 border-t border-gray-100 sm:p-6 rounded-b-xl">
      <button on:click={closeEditModal} class="px-6 py-2.5 text-sm font-bold text-white transition-all bg-red-600 rounded-lg shadow-md hover:bg-red-700 active:scale-95">Cancel</button>
      <button on:click={submitEditAnggota} class="px-6 py-2.5 text-sm font-bold text-white transition-all bg-[#0a2e52] rounded-lg shadow-md hover:bg-blue-900 active:scale-95">Update Data</button>
    </div>
  </div>
</div>
{/if}

<!-- MODAL MANAGE TEAM -->
{#if isManageTeamModalOpen}
<div class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
  <div class="absolute inset-0 cursor-pointer bg-black/60 backdrop-blur-sm" on:click={closeManageTeamModal} aria-hidden="true"></div>
  <div class="relative flex flex-col w-full max-w-3xl max-h-[90vh] shadow-2xl bg-white rounded-xl">
    <div class="flex items-center justify-between p-5 bg-white border-b border-gray-100 sm:p-6 rounded-t-xl">
      <div>
        <h3 class="text-lg font-extrabold text-gray-800 sm:text-xl">Manage Team</h3>
        <p class="text-sm text-gray-500 mt-1">Kelola semua team yang tersedia</p>
      </div>
      <button on:click={closeManageTeamModal} class="flex items-center justify-center w-8 h-8 text-white transition-colors shadow-sm bg-[#0a2e52] hover:bg-red-600 rounded-md">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </div>
    
    <div class="flex-1 overflow-y-auto p-5 sm:p-6">
      {#if teamList.length === 0}
        <div class="flex flex-col items-center justify-center py-12 text-center">
          <svg class="w-16 h-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p class="text-gray-500 font-medium">Belum ada team yang dibuat</p>
          <p class="text-sm text-gray-400 mt-1">Klik tombol "Buat Team" untuk membuat team baru</p>
        </div>
      {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          {#each teamList as team}
            <div class="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden">
              {#if isEditingTeam && editingTeamId === team.id}
                <!-- Edit Mode -->
                <div class="p-4 bg-blue-50 border-b border-blue-100">
                  <div class="flex items-center gap-2 mb-3">
                    <span class="text-sm font-bold text-blue-700">Edit Team</span>
                  </div>
                  <input 
                    type="text" 
                    bind:value={newTeamName} 
                    placeholder="Masukkan nama team baru"
                    class="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    on:keydown={(e) => { if (e.key === 'Enter') updateTeamName(); }}
                  />
                  <div class="flex gap-2 mt-3">
                    <button 
                      on:click={updateTeamName} 
                      disabled={isSubmittingTeam}
                      class="px-4 py-2 text-xs font-bold text-white bg-[#0a2e52] rounded-lg hover:bg-blue-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                      {#if isSubmittingTeam}
                        <div class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Menyimpan...
                      {:else}
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Simpan
                      {/if}
                    </button>
                    <button 
                      on:click={cancelEditTeam} 
                      class="px-4 py-2 text-xs font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              {:else}
                <!-- View Mode -->
                <div class="p-4">
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <div class="flex items-center gap-2">
                        <div class="w-10 h-10 rounded-full bg-[#0a2e52] flex items-center justify-center text-white font-bold text-sm">
                          {team.nama_tim.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 class="font-bold text-gray-800">{team.nama_tim}</h4>
                        </div>
                      </div>
                      <div class="mt-2 flex items-center gap-2">
                        <span class="text-xs text-gray-500">Jumlah Anggota:</span>
                        <span class="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                          {anggotaList.filter(a => a.team === team.nama_tim).length}
                        </span>
                      </div>
                    </div>
                    <div class="flex gap-1.5">
                      <button 
                        on:click={() => startEditTeam(team)} 
                        class="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Team"
                      >
                        <svg class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button 
                        on:click={() => deleteTeam(team.id, team.nama_tim)} 
                        class="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus Team"
                      >
                        <svg class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>
    
    <div class="flex justify-end gap-3 p-5 bg-gray-50 border-t border-gray-100 sm:p-6 rounded-b-xl">

      <button on:click={closeManageTeamModal} class="px-6 py-2.5 text-sm font-bold text-white transition-all bg-red-600 rounded-lg shadow-md hover:bg-red-700 active:scale-95">
        Tutup
      </button>
        <button on:click={openModal} class="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-white whitespace-nowrap transition-all bg-[#0a4682] rounded-lg shadow-md hover:bg-[#0c5599] active:scale-95 w-full sm:w-auto">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Buat Team
        </button>
    </div>
  </div>
</div>
{/if}

<!-- MODAL BUAT TEAM -->
{#if isModalOpen}
<div class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
  <div class="absolute inset-0 cursor-pointer bg-black/40 backdrop-blur-sm" on:click={closeModal} aria-hidden="true"></div>
  <div class="relative flex flex-col w-full max-w-md shadow-2xl bg-white rounded-xl">
    <div class="flex items-center justify-between p-5 bg-white border-b border-gray-100 sm:p-6 rounded-t-xl">
      <h3 class="text-lg font-extrabold text-gray-800 sm:text-xl">Buat Team Baru</h3>
      <button on:click={closeModal} class="flex items-center justify-center w-8 h-8 text-white transition-colors shadow-sm bg-[#0a2e52] hover:bg-red-600 rounded-md">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </div>
    <div class="p-5 space-y-4 sm:p-6">
      <label for="namaTeam" class="block mb-2 text-sm font-bold text-gray-700">Nama Team</label>
      <input type="text" id="namaTeam" bind:value={namaTeam} placeholder="Masukkan nama team di sini..." class="w-full px-4 py-2.5 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a4682] focus:bg-white transition-all" />
    </div>
    <div class="flex justify-end gap-3 p-5 bg-gray-50 border-t border-gray-100 sm:p-6 rounded-b-xl">
      <button on:click={closeModal} class="px-6 py-2.5 text-sm font-bold text-white transition-all bg-red-600 rounded-lg shadow-md hover:bg-red-700 active:scale-95">Batal</button>
      <button on:click={submitTeam} class="px-6 py-2.5 text-sm font-bold text-white transition-all bg-[#0a4682] rounded-lg shadow-md hover:bg-[#0c5599] active:scale-95">Submit</button>
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
  
  .w-4\.5 {
    width: 1.125rem;
  }
  .h-4\.5 {
    height: 1.125rem;
  }
</style>