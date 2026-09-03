<script>
  import { onMount } from "svelte";
  import { push } from "svelte-spa-router";
  import Swal from "sweetalert2";
  import Sidebar from "../lib/Sidebar.svelte";
  import TheradCardBody from "../lib/TheradCardBody.svelte";
  import TopNavbar from "../lib/TopNavbar.svelte";
    import { fetchWithAuth } from "../lib/auth";

  let innerWidth = 0;
  let currentUserName = "Loading...";
  let isLoading = true;
  let userAvatar = "";
  const avatar = localStorage.getItem("user_avatar");

  if (avatar !== "null") {
    userAvatar = `/avatar/${localStorage.getItem("user_avatar")}`;
  }

  onMount(() => {
    const name = localStorage.getItem("user_name");
    if (name) {
      currentUserName = name;
    } else {
      push("/");
      return;
    }

    const userStatus = localStorage.getItem("status");
    if (userStatus === "false") {
      Swal.fire({
        icon: "warning",
        title: "Belum Verifikasi",
        text: "Redirecting......",
        confirmButtonColor: "#0b5ba2",
      }).then(() => {
        push("/verification");
      });
      return;
    }

    isLoading = false;
    fetchThreads(1);
  });

  function handleLogout() {
    Swal.fire({
      title: "Yakin ingin keluar?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#9ca3af",
      confirmButtonText: "Ya, Logout!",
    }).then((r) => {
      if (r.isConfirmed) {
        localStorage.clear();
        push("/");
      }
    });
  }

  /** @type {'thread' | 'tierlist' | 'members'} */
  let activeTab = "thread";

  /** @type {'list' | 'detail'} */
  let threadView = "list";

  let isLoadingThreads = true; // loading awal (page 1)
  let isLoadingMore = false; // loading pas nambah page berikutnya
  let hasMoreThreads = true;
  let currentPage = 1;
  let threads = [];
  let activeThread = null;

  // composer state
  let isComposerOpen = false;
  let composerTitle = "";
  let composerContent = "";
  let isSubmittingThread = false;

  // reply state
  let replyContent = "";
  let isSubmittingReply = false;
  let isLoadingReplies = false; // loading awal replies (page 1) pas buka thread
  let isLoadingMoreReplies = false; // loading pas nambah page reply berikutnya
  let hasMoreReplies = true;
  let currentReplyPage = 1;

  // ref ke elemen <main> yang scrollable, buat dengerin event scroll
  let mainEl;

  async function fetchThreads(page = 1) {
    if (page === 1) {
      isLoadingThreads = true;
    } else {
      isLoadingMore = true;
    }

    try {
      const res = await fetch(`/api/hub/threads?page=${page}`, {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(`Gagal fetch threads: ${res.status}`);
      }

      const json = await res.json();
      const rawThreads = json.data?.data || [];
      const paging = json.data?.paging || {};

      const mapped = rawThreads.map(normalizeThread);

      threads = page === 1 ? mapped : [...threads, ...mapped];
      currentPage = paging.page || page;

      const totalPage = paging.totalPage || 1;
      hasMoreThreads = currentPage < totalPage;
    } catch (e) {
      console.error("Gagal ambil thread:", e);
      if (page === 1) {
        threads = [];
        Swal.fire({
          icon: "error",
          title: "Gagal memuat thread",
          text: "Coba refresh halaman ini.",
          confirmButtonColor: "#0a4682",
        });
      }
      hasMoreThreads = false;
    } finally {
      isLoadingThreads = false;
      isLoadingMore = false;
    }
  }

  function loadMoreThreads() {
    if (isLoadingMore || isLoadingThreads || !hasMoreThreads) return;
    fetchThreads(currentPage + 1);
  }

  // Dipanggil tiap kali <main> di-scroll. Kalau posisi scroll udah
  // mepet bawah (300px sebelum benar-benar bawah), auto load page berikutnya.
  // Berlaku buat list thread MAUPUN list reply di dalam detail thread.
  function handleScroll(event) {
    if (activeTab !== "thread") return;

    const el = event.target;
    const distanceToBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight;

    if (distanceToBottom >= 300) return;

    if (threadView === "list") {
      loadMoreThreads();
    } else if (threadView === "detail") {
      loadMoreReplies();
    }
  }

  function normalizeThread(raw) {
    return {
      id: raw.id,
      title: raw.title,
      content: raw.content ?? null,
      pinned: raw.pinned,
      createdAt: raw.createdAt,
      author: {
        id: raw.author?.id,
        nama: raw.author?.nama || "Tanpa Nama",
        pfp: normalizePfp(raw.author?.pfp),
      },
      replyCount: raw._count?.replies ?? 0,
      likeCount: raw._count?.likes ?? 0,
      likedByMe: (raw.likes?.length ?? 0) > 0,
      replies: raw.replies || [],
    };
  }

  function normalizePfp(pfp) {
    if (!pfp) return null;
    return `/avatar/${pfp}`;
  }

  function normalizeReply(raw) {
    return {
      id: raw.id,
      content: raw.content,
      createdAt: raw.createdAt,
      author: {
        id: raw.author?.id,
        nama: raw.author?.nama || "Tanpa Nama",
        pfp: normalizePfp(raw.author?.pfp),
      },
      likeCount: raw._count?.likes ?? 0,
      likedByMe: (raw.likes?.length ?? 0) > 0,
    };
  }

  async function openThread(thread) {
    threadView = "detail";
    activeThread = { ...thread, replies: [] };

    // reset pagination reply tiap kali buka thread baru
    currentReplyPage = 1;
    hasMoreReplies = true;
    isLoadingReplies = true;

    try {
      const res = await fetch(`/api/hub/threads/${thread.id}?page=1`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Gagal fetch detail thread: ${res.status}`);

      const json = await res.json();
      const rawThread = json.data?.thread;
      const rawReplies = json.data?.replies || [];
      const pagingReplies = json.data?.pagingReplies || {};

      activeThread = normalizeThread(rawThread);
      activeThread.replies = rawReplies.map(normalizeReply);

      currentReplyPage = pagingReplies.page || 1;

      // NOTE: pagingReplies.totalItems/totalPage dari backend keliatan buggy
      // (cuma ngitung item di page ini, bukan total beneran di DB).
      // Jadi pakai thread._count.replies sebagai acuan total yang akurat.
      hasMoreReplies = activeThread.replies.length < activeThread.replyCount;
    } catch (e) {
      console.error("Gagal buka thread:", e);
      Swal.fire({
        icon: "error",
        title: "Gagal memuat thread",
        confirmButtonColor: "#0a4682",
      });
      threadView = "list";
    } finally {
      isLoadingReplies = false;
    }
  }

  async function loadMoreReplies() {
    if (
      isLoadingMoreReplies ||
      isLoadingReplies ||
      !hasMoreReplies ||
      !activeThread
    )
      return;

    isLoadingMoreReplies = true;
    const nextPage = currentReplyPage + 1;

    try {
      const res = await fetch(
        `/api/hub/threads/${activeThread.id}?page=${nextPage}`,
        { credentials: "include" },
      );
      if (!res.ok) throw new Error(`Gagal fetch replies: ${res.status}`);

      const json = await res.json();
      const rawReplies = json.data?.replies || [];
      const pagingReplies = json.data?.pagingReplies || {};

      activeThread.replies = [
        ...activeThread.replies,
        ...rawReplies.map(normalizeReply),
      ];
      activeThread = { ...activeThread };

      currentReplyPage = pagingReplies.page || nextPage;

      // Sama kayak di openThread: pakai _count.replies (activeThread.replyCount)
      // sebagai acuan total yang akurat, bukan pagingReplies yang buggy.
      hasMoreReplies = activeThread.replies.length < activeThread.replyCount;

      // Safety: kalau backend gak balikin reply baru sama sekali padahal
      // hasMoreReplies masih true, paksa stop biar gak infinite loop nge-fetch.
      if (rawReplies.length === 0) {
        hasMoreReplies = false;
      }
    } catch (e) {
      console.error("Gagal load more replies:", e);
      hasMoreReplies = false;
    } finally {
      isLoadingMoreReplies = false;
    }
  }

  function backToList() {
    threadView = "list";
    activeThread = null;
  }

  function toggleComposer() {
    isComposerOpen = !isComposerOpen;
  }

  function cancelComposer() {
    isComposerOpen = false;
    composerTitle = "";
    composerContent = "";
  }


  async function submitThread() {
    if (!composerTitle.trim() || !composerContent.trim()) {
        Swal.fire({
            icon: "warning",
            title: "Lengkapi dulu",
            text: "Judul dan isi thread wajib diisi.",
            confirmButtonColor: "#0a4682",
        });
        return;
    }

    isSubmittingThread = true;
    try {
        const res = await fetch("/api/hub/threads/create", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                title: composerTitle.trim(), 
                content: composerContent.trim() 
            }),
        });

        const json = await res.json();

        if (!res.ok) {
            throw new Error(json.message || "Gagal membuat thread");
        }

        const newThread = json.data || json;

        threads = [
            {
                id: newThread.id,
                title: newThread.title,
                content: newThread.content,
                pinned: newThread.pinned || false,
                createdAt: new Date(newThread.createdAt || Date.now()),
                author: {
                    nama: newThread.author?.nama || currentUserName,
                    pfp: newThread.author?.pfp || userAvatar || null,
                },
                replyCount: newThread.replyCount || 0,
                likeCount: newThread.likeCount || 0,
                likedByMe: newThread.likedByMe || false,
                replies: newThread.replies || [],
            },
            ...threads,
        ];

        Swal.fire({
            icon: "success",
            title: "Berhasil!",
            text: "Thread berhasil dibuat.",
            timer: 1500,
            showConfirmButton: false,
        });

        cancelComposer();

    } catch (error) {
        console.error("Error creating thread:", error);
        Swal.fire({
            icon: "error",
            title: "Gagal bikin thread",
            text: error.message || "Terjadi kesalahan, coba lagi.",
            confirmButtonColor: "#0a4682",
        });
    } finally {
        isSubmittingThread = false;
    }
}

  // TODO: ganti dengan fetch beneran ke POST /api/threads/:id/replies
  async function submitReply() {
    if (!replyContent.trim() || !activeThread) return;

    isSubmittingReply = true;
    try {
      const res = await fetch(`/api/hub/threads/${activeThread.id}/reply`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyContent }),
      });

      activeThread.replies = [
        ...activeThread.replies,
        {
          id: crypto.randomUUID(),
          content: replyContent,
          createdAt: new Date(),
          author: { nama: currentUserName, pfp: userAvatar || null },
        },
      ];
      activeThread.replyCount += 1;
      replyContent = "";
    } catch (e) {
      Swal.fire({
        icon: "error",
        title: "Gagal kirim balasan",
        confirmButtonColor: "#0a4682",
      });
    } finally {
      isSubmittingReply = false;
    }
  }

async function toggleLike(thread) {
    try {
        // Optimistic update
        const wasLiked = thread.likedByMe;
        thread.likedByMe = !thread.likedByMe;
        thread.likeCount += thread.likedByMe ? 1 : -1;
        threads = [...threads];

        const res = await fetchWithAuth(`/api/hub/threads/${thread.id}/like`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) {
            // Rollback jika gagal
            thread.likedByMe = wasLiked;
            thread.likeCount += wasLiked ? 1 : -1;
            threads = [...threads];
            
            const json = await res.json().catch(() => ({}));
            Swal.fire({
                icon: "error",
                title: "Gagal",
                text: json.message || "Gagal menyukai thread.",
                confirmButtonColor: "#0a4682",
            });
        }

    } catch (error) {
        console.error("Error toggling like:", error);
        // Rollback
        const wasLiked = thread.likedByMe;
        thread.likedByMe = !wasLiked;
        thread.likeCount += wasLiked ? 1 : -1;
        threads = [...threads];
        
        Swal.fire({
            icon: "error",
            title: "Gagal",
            text: "Terjadi kesalahan, silakan coba lagi.",
            confirmButtonColor: "#0a4682",
        });
    }
}

async function toggleReplyLike(reply) {
    try {
        const wasLiked = reply.likedByMe;
        reply.likedByMe = !reply.likedByMe;
        reply.likeCount = (reply.likeCount || 0) + (reply.likedByMe ? 1 : -1);
        
        activeThread = { ...activeThread };
        
        const threadIndex = threads.findIndex(t => t.id === activeThread.id);
        if (threadIndex !== -1) {
            const replyIndex = threads[threadIndex].replies.findIndex(r => r.id === reply.id);
            if (replyIndex !== -1) {
                threads[threadIndex].replies[replyIndex] = { ...reply };
                threads = [...threads];
            }
        }

        const res = await fetch(`/api/hub/threads/${activeThread.id}/reply/${reply.id}/like`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) {
            reply.likedByMe = wasLiked;
            reply.likeCount = (reply.likeCount || 0) + (wasLiked ? 1 : -1);
            activeThread = { ...activeThread };
            
            const json = await res.json().catch(() => ({}));
            Swal.fire({
                icon: "error",
                title: "Gagal",
                text: json.message || "Gagal menyukai balasan.",
                confirmButtonColor: "#0a4682",
            });
        }

    } catch (error) {
        console.error("Error toggling reply like:", error);
        const wasLiked = reply.likedByMe;
        reply.likedByMe = !wasLiked;
        reply.likeCount = (reply.likeCount || 0) + (wasLiked ? 1 : -1);
        activeThread = { ...activeThread };
        
        Swal.fire({
            icon: "error",
            title: "Gagal",
            text: "Terjadi kesalahan, silakan coba lagi.",
            confirmButtonColor: "#0a4682",
        });
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

<svelte:window bind:innerWidth />

{#if isLoading}
  <div class="flex items-center justify-center h-screen bg-gray-50">
    <div class="text-center">
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0a2e52] mx-auto"
      ></div>
      <p class="mt-4 text-gray-600">Memuat SmegioneHub...</p>
    </div>
  </div>
{:else}
  <div class="flex h-screen overflow-hidden font-sans bg-gray-50">
    <Sidebar {handleLogout} />

    <div class="flex flex-col flex-1 h-full overflow-hidden">
      <TopNavbar
        {handleLogout}
        {currentUserName}
        {userAvatar}
        title="SmegioneHub"
      />
      <main
        bind:this={mainEl}
        on:scroll={handleScroll}
        class="flex-1 overflow-y-auto bg-[#fbfcfd]"
      >
        <div class="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
          <h1 class="text-2xl font-extrabold text-[#0b355b] mb-1">
            SmegioneHub
          </h1>
          <p class="text-sm text-gray-500 mb-6">
            Tempat ngumpul, diskusi, dan pamer progress bareng tim.
          </p>

          <div class="flex items-center gap-2 mb-6 border-b border-gray-200">
            <button
              on:click={() => (activeTab = "thread")}
              class="px-4 py-2.5 text-sm font-bold border-b-2 transition-colors
                        {activeTab === 'thread'
                ? 'border-[#0a4682] text-[#0a4682]'
                : 'border-transparent text-gray-400 hover:text-gray-600'}"
            >
              Thread
            </button>
            <button
              disabled
              class="px-4 py-2.5 text-sm font-bold border-b-2 border-transparent text-gray-300 cursor-not-allowed flex items-center gap-1.5"
            >
              Tier List
              <span
                class="text-[10px] font-semibold bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full"
                >Segera</span
              >
            </button>
            <button
              disabled
              class="px-4 py-2.5 text-sm font-bold border-b-2 border-transparent text-gray-300 cursor-not-allowed flex items-center gap-1.5"
            >
              Members
              <span
                class="text-[10px] font-semibold bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full"
                >Segera</span
              >
            </button>
          </div>

          {#if activeTab === "thread"}
            {#if threadView === "list"}
              <div
                class="bg-white border border-slate-100 rounded-2xl shadow-sm mb-6 overflow-hidden"
              >
                {#if !isComposerOpen}
                  <button
                    on:click={toggleComposer}
                    class="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50 transition-colors"
                  >
                    {#if userAvatar}
                      <img
                        src={userAvatar}
                        alt="Profile"
                        class="w-9 h-9 rounded-full object-cover border border-gray-200 shrink-0"
                      />
                    {:else}
                      <div
                        class="w-9 h-9 rounded-full bg-gray-400 flex items-center justify-center shrink-0"
                      >
                        <span class="text-sm font-bold text-white"
                          >{currentUserName.charAt(0).toUpperCase()}</span
                        >
                      </div>
                    {/if}
                    <span class="text-sm text-gray-400"
                      >Lagi mikirin apa, {currentUserName.split(" ")[0]}?</span
                    >
                  </button>
                {:else}
                  <div class="p-4 space-y-3">
                    <input
                      type="text"
                      bind:value={composerTitle}
                      placeholder="Judul thread"
                      class="w-full px-4 py-2.5 text-sm font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                    <textarea
                      bind:value={composerContent}
                      rows="3"
                      placeholder="Tulis sesuatu buat dibagikan ke tim..."
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
                        on:click={submitThread}
                        disabled={isSubmittingThread}
                        class="px-5 py-2 text-sm font-bold text-white bg-[#0a4682] rounded-lg shadow-md hover:bg-[#0c5599] active:scale-95 transition-all disabled:opacity-60"
                      >
                        {isSubmittingThread ? "Mengirim..." : "Posting"}
                      </button>
                    </div>
                  </div>
                {/if}
              </div>

              {#if isLoadingThreads}
                <div class="flex flex-col items-center py-16">
                  <div
                    class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0a4682]"
                  ></div>
                  <p class="mt-3 text-sm text-gray-400">Memuat thread...</p>
                </div>
              {:else if threads.length === 0}
                <div
                  class="text-center py-16 bg-white border border-slate-100 rounded-2xl"
                >
                  <p class="font-semibold text-gray-600">Belum ada thread</p>
                  <p class="text-xs text-gray-400 mt-1">
                    Jadilah yang pertama mulai obrolan!
                  </p>
                </div>
              {:else}
                <div class="space-y-3">
                  {#each threads.filter((t) => t.pinned) as thread}
                    <button
                      on:click={() => openThread(thread)}
                      class="w-full text-left bg-white border border-amber-100 bg-amber-50/40 rounded-2xl shadow-sm hover:shadow-md transition-all p-4"
                    >
                      <div class="flex items-center gap-1.5 mb-2">
                        <svg
                          class="w-3.5 h-3.5 text-amber-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          ><path
                            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                          /></svg
                        >
                        <span
                          class="text-[11px] font-bold text-amber-600 uppercase tracking-wide"
                          >Pinned</span
                        >
                      </div>
                      <TheradCardBody
                        {thread}
                        {timeAgo}
                        onLike={() => toggleLike(thread)}
                      />
                    </button>
                  {/each}

                  {#each threads.filter((t) => !t.pinned) as thread}
                    <button
                      on:click={() => openThread(thread)}
                      class="w-full text-left bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all p-4"
                    >
                      <TheradCardBody
                        {thread}
                        {timeAgo}
                        onLike={() => toggleLike(thread)}
                      />
                    </button>
                  {/each}
                </div>

                <!-- ============================================================
                INFINITE SCROLL: indikator loading / akhir list
                ============================================================ -->
                {#if isLoadingMore}
                  <div class="flex justify-center py-6">
                    <div
                      class="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0a4682]"
                    ></div>
                  </div>
                {:else if !hasMoreThreads}
                  <p class="text-center text-xs text-gray-300 py-6">
                    Udah paling bawah nih 👀
                  </p>
                {/if}
              {/if}
            {:else if threadView === "detail" && activeThread}
              <!-- Thread Detail -->
              <button
                on:click={backToList}
                class="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-[#0a4682] mb-4 transition-colors"
              >
                <svg
                  class="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2.5"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Kembali
              </button>

              <div
                class="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 sm:p-6 mb-4"
              >
                <div class="flex items-center gap-3 mb-4">
                  {#if activeThread.author.pfp}
                    <img
                      src={activeThread.author.pfp}
                      alt={activeThread.author.nama}
                      class="w-10 h-10 rounded-full object-cover border border-gray-200"
                    />
                  {:else}
                    <div
                      class="w-10 h-10 rounded-full bg-gray-400 flex items-center justify-center"
                    >
                      <span class="text-sm font-bold text-white"
                        >{activeThread.author.nama
                          .charAt(0)
                          .toUpperCase()}</span
                      >
                    </div>
                  {/if}
                  <div>
                    <p class="text-sm font-bold text-gray-800">
                      {activeThread.author.nama}
                    </p>
                    <p class="text-xs text-gray-400">
                      {timeAgo(activeThread.createdAt)}
                    </p>
                  </div>
                </div>

                <h2 class="text-xl font-extrabold text-[#0b355b] mb-2">
                  {activeThread.title}
                </h2>
                <p
                  class="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap"
                >
                  {activeThread.content}
                </p>

                <div
                  class="flex items-center gap-4 mt-5 pt-4 border-t border-gray-100"
                >
                  <button
                    on:click={() => toggleLike(activeThread)}
                    class="flex items-center gap-1.5 text-sm font-medium transition-colors {activeThread.likedByMe
                      ? 'text-red-500'
                      : 'text-gray-500 hover:text-red-400'}"
                  >
                    <svg
                      class="w-5 h-5"
                      fill={activeThread.likedByMe ? "currentColor" : "none"}
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                    <span>{activeThread.likeCount}</span>
                  </button>

                  <span
                    class="flex items-center gap-1.5 text-sm font-medium text-gray-500"
                  >
                    <svg
                      class="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    <span>{activeThread.replyCount} Balasan</span>
                  </span>
                  <button
                    class="ml-auto flex items-center gap-1 text-xs text-gray-300 hover:text-red-400 transition-colors"
                  >
                    <svg
                      class="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M3 3l18 18M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Laporkan
                  </button>
                </div>
              </div>

              <h3 class="text-sm font-bold text-gray-700 mb-3">
                {activeThread.replies.length} Balasan
              </h3>

              <div class="space-y-3 mb-24">
    {#each activeThread.replies as reply}
        <div class="bg-white border border-slate-100 rounded-xl shadow-sm p-4 flex gap-3">
            {#if reply.author.pfp}
                <img
                    src={reply.author.pfp}
                    alt={reply.author.nama}
                    class="w-8 h-8 rounded-full object-cover border border-gray-200 shrink-0"
                />
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
                
                <!-- Like Button untuk Reply -->
                <button
                    on:click={() => toggleReplyLike(reply)}
                    class="flex items-center gap-1 mt-2 text-xs font-medium transition-colors {reply.likedByMe ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}"
                >
                    <svg
                        class="w-3.5 h-3.5"
                        fill={reply.likedByMe ? "currentColor" : "none"}
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        stroke-width="2"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                    </svg>
                    <span>{reply.likeCount || 0}</span>
                </button>
            </div>
        </div>
    {:else}
        <p class="text-sm text-gray-400 text-center py-8">
            Belum ada balasan, jadi yang pertama!
        </p>
    {/each}

    {#if isLoadingMoreReplies}
      <div class="flex justify-center py-4">
        <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-[#0a4682]"></div>
      </div>
    {:else if !hasMoreReplies && activeThread.replies.length > 0}
      <p class="text-center text-xs text-gray-300 py-4">
        Semua balasan udah kemuat 👀
      </p>
    {/if}
</div>

              <!-- Reply box -->
              <div
                class="fixed bottom-0 left-0 right-0 md:left-64 bg-white border-t border-gray-200 p-3 sm:p-4"
              >
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
        </div>
      </main>
    </div>
  </div>
{/if}