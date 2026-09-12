<script>
  import { onMount } from "svelte";
  import Swal from "sweetalert2";
  import TierlistCardBody from "./TierlistCardBody.svelte";

  export let currentUserName;
  export let userAvatar;

  let view = "list";

  let tierlists = [];
  let activeTierlist = null;

  let isLoadingList = true;
  let isLoadingMore = false;
  let hasMore = true;
  let currentPage = 1;

  let isLoadingDetail = false;
  let isLoadingMoreReplies = false;
  let hasMoreReplies = true;
  let currentReplyPage = 1;

  // composer state (create tierlist baru)
  let isComposerOpen = false;
  let composerContent = "";
  let composerImageFile = null;
  let composerImagePreview = null;
  let isSubmitting = false;

  // reply composer state (MOCK, belum ada endpoint POST reply)
  let replyContent = "";
  let isSubmittingReply = false;

  onMount(() => {
    fetchTierlists(1);
  });

  // ============================================================
  // Dipanggil dari parent (SmegioneHub.svelte) tiap kali <main>
  // di-scroll deket bawah, sementara tab aktif = "tierlist".
  // ============================================================
  export function onScrollNearBottom() {
    if (view === "list") {
      loadMoreTierlists();
    } else if (view === "detail") {
      loadMoreReplies();
    }
  }

  function normalizePfp(pfp) {
    if (!pfp) return null;
    return `/avatar/${pfp}`;
  }

  // NOTE: asumsi gambar tierlist disajikan dari /assets/<filename>,
  // sama kayak pola bukti absen di Absensi.svelte. Sesuaikan kalau
  // ternyata path static file-nya beda di backend kamu.
  function normalizeImage(image) {
    if (!image) return null;
    return `/assets/${image}`;
  }

  function normalizeTierlist(raw) {
    return {
      id: raw.id,
      content: raw.content,
      createdAt: raw.createdAt,
      image: normalizeImage(raw.image),
      author: {
        nama: raw.user?.nama || "Tanpa Nama",
        pfp: normalizePfp(raw.user?.pfp),
      },
      replyCount: raw._count?.replies ?? 0,
      // Backend sekarang balikin likeCount langsung di root item
      // (net vote, bisa negatif), bukan lagi di _count.likes.
      likeCount: raw.likeCount ?? 0,
      // -1 | 0 | 1 — sekarang dibaca dari response beneran
      myVote: raw.myVote ?? 0,
    };
  }

  function normalizeTierlistDetail(raw) {
    return {
      id: raw.id,
      content: raw.content,
      createdAt: raw.createdAt,
      image: normalizeImage(raw.image),
      author: {
        id: raw.user?.id,
        nama: raw.user?.nama || "Tanpa Nama",
        pfp: normalizePfp(raw.user?.pfp),
      },
      replyCount: raw._count?.replies ?? 0,
      // Sama kayak list: prioritaskan raw.likeCount (format baru),
      // fallback ke _count.likes kalau endpoint detail belum diupdate.
      likeCount: raw.likeCount ?? raw._count?.likes ?? 0,
      // Sekarang beneran dibaca dari backend (myVote: -1 | 0 | 1)
      myVote: raw.myVote ?? 0,
      replies: [],
    };
  }

  function normalizeReply(raw) {
    // Defensif: jaga-jaga kalau backend pakai key 'author' atau 'user'
    // buat pengarang reply (contoh response reply masih kosong tadi).
    const authorRaw = raw.author || raw.user || {};
    return {
      id: raw.id,
      content: raw.content,
      createdAt: raw.createdAt,
      author: {
        nama: authorRaw.nama || "Tanpa Nama",
        pfp: normalizePfp(authorRaw.pfp),
      },
      likeCount: raw._count?.likes ?? (raw.likes?.length ?? 0),
      likedByMe: (raw.likes?.length ?? 0) > 0,
    };
  }

  // ============================================================
  // FETCH LIST TIERLIST (real, infinite scroll)
  // ============================================================
  async function fetchTierlists(page = 1) {
    if (page === 1) {
      isLoadingList = true;
    } else {
      isLoadingMore = true;
    }

    try {
      const res = await fetch(`/api/hub/tierlist?page=${page}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Gagal fetch tierlist: ${res.status}`);

      const json = await res.json();
      const rawList = json.data?.data || [];
      const paging = json.data?.paging || {};
      const mapped = rawList.map(normalizeTierlist);

      tierlists = page === 1 ? mapped : [...tierlists, ...mapped];
      currentPage = Number(paging.page) || page;

      const totalPage = paging.totalPage || 1;
      hasMore = currentPage < totalPage;
    } catch (e) {
      console.error("Gagal ambil tierlist:", e);
      if (page === 1) {
        tierlists = [];
        Swal.fire({
          icon: "error",
          title: "Gagal memuat tier list",
          text: "Coba refresh halaman ini.",
          confirmButtonColor: "#0a4682",
        });
      }
      hasMore = false;
    } finally {
      isLoadingList = false;
      isLoadingMore = false;
    }
  }

  function loadMoreTierlists() {
    if (isLoadingMore || isLoadingList || !hasMore) return;
    fetchTierlists(currentPage + 1);
  }

  // ============================================================
  // DETAIL TIERLIST + REPLIES (fetch real, page-based)
  // ============================================================
  async function openTierlist(item) {
    view = "detail";
    activeTierlist = { ...item, replies: [] };

    currentReplyPage = 1;
    hasMoreReplies = true;
    isLoadingDetail = true;

    try {
      const res = await fetch(`/api/hub/tierlist/${item.id}?page=1`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Gagal fetch detail tierlist: ${res.status}`);

      const json = await res.json();
      const rawDetail = json.data?.tier_list;
      const rawReplies = json.data?.tierlistReply || [];
      const pagingReplies = json.data?.pagingReplies || {};

      activeTierlist = normalizeTierlistDetail(rawDetail);
      activeTierlist.replies = rawReplies.map(normalizeReply);

      currentReplyPage = pagingReplies.page || 1;
      // Sama kayak thread: kalau pagingReplies.totalPage keliatan gak akurat,
      // fallback ke _count.replies sebagai acuan total yang lebih dipercaya.
      hasMoreReplies = activeTierlist.replies.length < activeTierlist.replyCount;
    } catch (e) {
      console.error("Gagal buka tierlist:", e);
      Swal.fire({
        icon: "error",
        title: "Gagal memuat tier list",
        confirmButtonColor: "#0a4682",
      });
      view = "list";
    } finally {
      isLoadingDetail = false;
    }
  }

  async function loadMoreReplies() {
    if (
      isLoadingMoreReplies ||
      isLoadingDetail ||
      !hasMoreReplies ||
      !activeTierlist
    )
      return;

    isLoadingMoreReplies = true;
    const nextPage = currentReplyPage + 1;

    try {
      const res = await fetch(
        `/api/hub/tierlist/${activeTierlist.id}?page=${nextPage}`,
        { credentials: "include" },
      );
      if (!res.ok) throw new Error(`Gagal fetch replies: ${res.status}`);

      const json = await res.json();
      const rawReplies = json.data?.tierlistReply || [];
      const pagingReplies = json.data?.pagingReplies || {};

      activeTierlist.replies = [
        ...activeTierlist.replies,
        ...rawReplies.map(normalizeReply),
      ];
      activeTierlist = { ...activeTierlist };

      currentReplyPage = pagingReplies.page || nextPage;
      hasMoreReplies = activeTierlist.replies.length < activeTierlist.replyCount;

      if (rawReplies.length === 0) {
        hasMoreReplies = false;
      }
    } catch (e) {
      console.error("Gagal load more replies tierlist:", e);
      hasMoreReplies = false;
    } finally {
      isLoadingMoreReplies = false;
    }
  }

  function backToList() {
    view = "list";
    activeTierlist = null;
  }

  // ============================================================
  // COMPOSER: buat tierlist baru (real, POST multipart/form-data)
  // ============================================================
  function toggleComposer() {
    isComposerOpen = !isComposerOpen;
  }

  function handleImageSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const allowedTypes = ["image/png", "image/jpg", "image/jpeg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      Swal.fire({
        icon: "warning",
        title: "Tipe File Tidak Didukung",
        text: "Hanya file gambar (PNG/JPG/WEBP) yang diperbolehkan!",
        confirmButtonColor: "#0a4682",
      });
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({
        icon: "warning",
        title: "Ukuran File Terlalu Besar",
        text: "Ukuran gambar maksimal 5MB!",
        confirmButtonColor: "#0a4682",
      });
      event.target.value = "";
      return;
    }

    composerImageFile = file;
    if (composerImagePreview) URL.revokeObjectURL(composerImagePreview);
    composerImagePreview = URL.createObjectURL(file);
  }

  function removeImage() {
    composerImageFile = null;
    if (composerImagePreview) URL.revokeObjectURL(composerImagePreview);
    composerImagePreview = null;
    const input = document.getElementById("tierlist-image-input");
    if (input) input.value = "";
  }

  function cancelComposer() {
    isComposerOpen = false;
    composerContent = "";
    removeImage();
  }

  async function submitTierlist() {
    if (!composerImageFile || !composerContent.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Lengkapi dulu",
        text: "Gambar dan caption wajib diisi.",
        confirmButtonColor: "#0a4682",
      });
      return;
    }

    isSubmitting = true;
    try {
      const formData = new FormData();
      formData.append("image", composerImageFile);
      formData.append("content", composerContent.trim());

      const res = await fetch("/api/hub/tierlist/create", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || "Gagal membuat tier list");
      }

      const newItem = json.data;

      tierlists = [
        {
          id: newItem.id,
          content: newItem.content,
          createdAt: newItem.createdAt,
          image: normalizeImage(newItem.image),
          author: { nama: currentUserName, pfp: userAvatar || null },
          replyCount: 0,
          likeCount: 0,
          myVote: 0,
        },
        ...tierlists,
      ];

      Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: "Tier list berhasil diposting.",
        timer: 1500,
        showConfirmButton: false,
      });

      cancelComposer();
    } catch (error) {
      console.error("Error creating tierlist:", error);
      Swal.fire({
        icon: "error",
        title: "Gagal posting",
        text: error.message || "Terjadi kesalahan, coba lagi.",
        confirmButtonColor: "#0a4682",
      });
    } finally {
      isSubmitting = false;
    }
  }

  // ============================================================
  // VOTE (real, POST /api/hub/tierlist/:id/vote — toggle up/downvote)
  // ============================================================
  // Set berisi id tierlist yang lagi diproses vote-nya, biar gak
  // bisa diklik dobel sebelum request sebelumnya selesai (race condition).
  let votingIds = new Set();

  async function handleVote(item, dir) {
    if (votingIds.has(item.id)) return;
    votingIds.add(item.id);
    votingIds = votingIds;

    const prevVote = item.myVote;
    const prevLikeCount = item.likeCount;

    // Optimistic update dulu biar responsif
    const optimisticVote = prevVote === dir ? 0 : dir;
    item.myVote = optimisticVote;
    item.likeCount += optimisticVote - prevVote;
    tierlists = [...tierlists];

    try {
      const res = await fetch(`/api/hub/tierlist/${item.id}/vote`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: dir }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.message || "Gagal vote");
      }

      const json = await res.json();
      // Samain sama nilai final dari server (source of truth)
      item.likeCount = json.data?.likeCount ?? item.likeCount;
      item.myVote = json.data?.myVote ?? item.myVote;
      tierlists = [...tierlists];
    } catch (e) {
      console.error("Gagal vote tierlist:", e);
      // Rollback ke nilai sebelum diklik
      item.myVote = prevVote;
      item.likeCount = prevLikeCount;
      tierlists = [...tierlists];

      Swal.fire({
        icon: "error",
        title: "Gagal vote",
        text: "Terjadi kesalahan, coba lagi.",
        confirmButtonColor: "#0a4682",
      });
    } finally {
      votingIds.delete(item.id);
      votingIds = votingIds;
    }
  }

  let isVotingDetail = false;

  async function handleVoteDetail(dir) {
    if (!activeTierlist || isVotingDetail) return;
    isVotingDetail = true;

    const prevVote = activeTierlist.myVote;
    const prevLikeCount = activeTierlist.likeCount;

    const optimisticVote = prevVote === dir ? 0 : dir;
    activeTierlist.myVote = optimisticVote;
    activeTierlist.likeCount += optimisticVote - prevVote;
    activeTierlist = { ...activeTierlist };

    try {
      const res = await fetch(`/api/hub/tierlist/${activeTierlist.id}/vote`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: dir }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.message || "Gagal vote");
      }

      const json = await res.json();
      activeTierlist.likeCount = json.data?.likeCount ?? activeTierlist.likeCount;
      activeTierlist.myVote = json.data?.myVote ?? activeTierlist.myVote;
      activeTierlist = { ...activeTierlist };
    } catch (e) {
      console.error("Gagal vote tierlist:", e);
      activeTierlist.myVote = prevVote;
      activeTierlist.likeCount = prevLikeCount;
      activeTierlist = { ...activeTierlist };

      Swal.fire({
        icon: "error",
        title: "Gagal vote",
        text: "Terjadi kesalahan, coba lagi.",
        confirmButtonColor: "#0a4682",
      });
    } finally {
      isVotingDetail = false;
    }
  }

  async function submitReply() {
    if (!replyContent.trim() || !activeTierlist) return;

    isSubmittingReply = true;

    try {
      const res = await fetch(
        `/api/hub/tierlist/${activeTierlist.id}/reply`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include",
          body: JSON.stringify({
            content: replyContent.trim()
          })
        }
      );

      const json = await res.json();

      if (!res.ok) {
        throw new Error(
          json.errors || json.message || "Gagal mengirim reply"
        );
      }

      const newReply = normalizeReply(json.data);

      activeTierlist.replies = [
        ...activeTierlist.replies,
        newReply
      ];

      activeTierlist.replyCount += 1;
      activeTierlist = { ...activeTierlist };

      replyContent = "";

    } catch (error) {
      console.error("Gagal mengirim reply:", error);

      Swal.fire({
        icon: "error",
        title: "Gagal mengirim balasan",
        text: error.message || "Terjadi kesalahan.",
        confirmButtonColor: "#0a4682"
      });

    } finally {
      isSubmittingReply = false;
    }
  }

  function timeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return "Baru saja";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} menit lalu`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} jam lalu`;
    const days = Math.floor(hours / 24);
    return `${days} hari lalu`;
  }
</script>

{#if view === "list"}
  <!-- Composer buat tierlist baru -->
  <div class="bg-white border border-slate-100 rounded-2xl shadow-sm mb-6 overflow-hidden">
    {#if !isComposerOpen}
      <button
        on:click={toggleComposer}
        class="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50 transition-colors"
      >
        {#if userAvatar}
          <img src={userAvatar} alt="Profile" class="w-9 h-9 rounded-full object-cover border border-gray-200 shrink-0" />
        {:else}
          <div class="w-9 h-9 rounded-full bg-gray-400 flex items-center justify-center shrink-0">
            <span class="text-sm font-bold text-white">{currentUserName.charAt(0).toUpperCase()}</span>
          </div>
        {/if}
        <span class="text-sm text-gray-400">Share tier list kamu, {currentUserName.split(" ")[0]}?</span>
      </button>
    {:else}
      <div class="p-4 space-y-3">
        {#if composerImagePreview}
          <div class="relative rounded-xl overflow-hidden bg-gray-50 border border-gray-200">
            <img src={composerImagePreview} alt="Preview" class="w-full max-h-72 object-contain" />
            <button
              on:click={removeImage}
              class="absolute top-2 right-2 flex items-center justify-center w-8 h-8 text-white bg-black/60 hover:bg-red-600 rounded-full transition-colors"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        {:else}
          <label
            for="tierlist-image-input"
            class="flex flex-col items-center justify-center gap-2 w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 hover:border-gray-400 transition-colors text-gray-400"
          >
            <svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span class="text-xs font-semibold">Klik buat upload gambar tier list</span>
          </label>
          <input
            id="tierlist-image-input"
            type="file"
            accept="image/png,image/jpg,image/jpeg,image/webp"
            on:change={handleImageSelect}
            class="hidden"
          />
        {/if}

        <textarea
          bind:value={composerContent}
          rows="3"
          placeholder="Tulis caption buat tier list ini..."
          class="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
        ></textarea>

        <div class="flex items-center justify-end gap-2">
          <button
            on:click={cancelComposer}
            class="px-4 py-2 text-sm font-bold text-gray-500 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Batal
          </button>
          <button
            on:click={submitTierlist}
            disabled={isSubmitting}
            class="px-5 py-2 text-sm font-bold text-white bg-[#0a4682] rounded-lg shadow-md hover:bg-[#0c5599] active:scale-95 transition-all disabled:opacity-60"
          >
            {isSubmitting ? "Mengirim..." : "Posting"}
          </button>
        </div>
      </div>
    {/if}
  </div>

  {#if isLoadingList}
    <div class="flex flex-col items-center py-16">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0a4682]"></div>
      <p class="mt-3 text-sm text-gray-400">Memuat tier list...</p>
    </div>
  {:else if tierlists.length === 0}
    <div class="text-center py-16 bg-white border border-slate-100 rounded-2xl">
      <p class="font-semibold text-gray-600">Belum ada tier list</p>
      <p class="text-xs text-gray-400 mt-1">Jadilah yang pertama posting!</p>
    </div>
  {:else}
    <div class="space-y-3">
      {#each tierlists as tierlist (tierlist.id)}
        <div class="bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all p-4">
          <TierlistCardBody
            {tierlist}
            {timeAgo}
            onOpen={() => openTierlist(tierlist)}
            onVote={(dir) => handleVote(tierlist, dir)}
          />
        </div>
      {/each}
    </div>

    {#if isLoadingMore}
      <div class="flex justify-center py-6">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0a4682]"></div>
      </div>
    {:else if !hasMore}
      <p class="text-center text-xs text-gray-300 py-6">Udah paling bawah nih 👀</p>
    {/if}
  {/if}
{:else if view === "detail"}
  {#if isLoadingDetail && !activeTierlist?.content}
    <div class="flex flex-col items-center py-16">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0a4682]"></div>
      <p class="mt-3 text-sm text-gray-400">Memuat tier list...</p>
    </div>
  {:else if activeTierlist}
    <button
      on:click={backToList}
      class="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-[#0a4682] mb-4 transition-colors"
    >
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      Kembali
    </button>

    <div class="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden mb-4">
      <div class="flex items-center gap-3 p-5 sm:p-6 pb-3">
        {#if activeTierlist.author.pfp}
          <img
            src={activeTierlist.author.pfp}
            alt={activeTierlist.author.nama}
            class="w-10 h-10 rounded-full object-cover border border-gray-200"
          />
        {:else}
          <div class="w-10 h-10 rounded-full bg-gray-400 flex items-center justify-center">
            <span class="text-sm font-bold text-white">{activeTierlist.author.nama.charAt(0).toUpperCase()}</span>
          </div>
        {/if}
        <div>
          <p class="text-sm font-bold text-gray-800">{activeTierlist.author.nama}</p>
          <p class="text-xs text-gray-400">{timeAgo(activeTierlist.createdAt)}</p>
        </div>
      </div>

      {#if activeTierlist.image}
        <img src={activeTierlist.image} alt="Tier list" class="w-full object-contain bg-gray-50" />
      {/if}

      <div class="p-5 sm:p-6">
        <p class="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{activeTierlist.content}</p>

        <div class="flex items-center gap-4 mt-5 pt-4 border-t border-gray-100">
          <div class="flex items-center gap-1">
            <button
              on:click={() => handleVoteDetail(1)}
              class="p-1.5 rounded-md transition-colors {activeTierlist.myVote === 1
                ? 'text-orange-600 bg-orange-50'
                : 'text-gray-400 hover:bg-gray-100'}"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 3l7 7h-4v7H7v-7H3l7-7z" /></svg>
            </button>
            <span class="text-sm font-bold text-gray-700 min-w-[1.4rem] text-center">{activeTierlist.likeCount}</span>
            <button
              on:click={() => handleVoteDetail(-1)}
              class="p-1.5 rounded-md transition-colors {activeTierlist.myVote === -1
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-400 hover:bg-gray-100'}"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 17l-7-7h4V3h6v7h4l-7 7z" /></svg>
            </button>
          </div>

          <span class="flex items-center gap-1.5 text-sm font-medium text-gray-500">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>{activeTierlist.replyCount} Balasan</span>
          </span>
        </div>
      </div>
    </div>

    <h3 class="text-sm font-bold text-gray-700 mb-3">{activeTierlist.replies.length} Balasan</h3>

    <div class="space-y-3 mb-24">
      {#each activeTierlist.replies as reply (reply.id)}
        <div class="bg-white border border-slate-100 rounded-xl shadow-sm p-4 flex gap-3">
          {#if reply.author.pfp}
            <img src={reply.author.pfp} alt={reply.author.nama} class="w-8 h-8 rounded-full object-cover border border-gray-200 shrink-0" />
          {:else}
            <div class="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center shrink-0">
              <span class="text-xs font-bold text-white">{reply.author.nama.charAt(0).toUpperCase()}</span>
            </div>
          {/if}
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <p class="text-sm font-bold text-gray-800">{reply.author.nama}</p>
              <p class="text-xs text-gray-400">{timeAgo(reply.createdAt)}</p>
            </div>
            <p class="text-sm text-gray-600 mt-1">{reply.content}</p>
          </div>
        </div>
      {:else}
        <p class="text-sm text-gray-400 text-center py-8">Belum ada balasan, jadi yang pertama!</p>
      {/each}

      {#if isLoadingMoreReplies}
        <div class="flex justify-center py-4">
          <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-[#0a4682]"></div>
        </div>
      {:else if !hasMoreReplies && activeTierlist.replies.length > 0}
        <p class="text-center text-xs text-gray-300 py-4">Semua balasan udah kemuat 👀</p>
      {/if}
    </div>

    <!-- Reply box (MOCK submit) -->
    <div class="fixed bottom-0 left-0 right-0 md:left-64 bg-white border-t border-gray-200 p-3 sm:p-4">
      <div class="max-w-3xl mx-auto flex items-end gap-2">
        <textarea
          bind:value={replyContent}
          rows="1"
          placeholder="Tulis balasan..."
          class="flex-1 px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
        ></textarea>
        <button
          on:click={submitReply}
          disabled={isSubmittingReply || !replyContent.trim()}
          class="px-5 py-2.5 text-sm font-bold text-white bg-[#0a4682] rounded-lg shadow-md hover:bg-[#0c5599] active:scale-95 transition-all disabled:opacity-40 shrink-0"
        >
          Kirim
        </button>
      </div>
    </div>
  {/if}
{/if}