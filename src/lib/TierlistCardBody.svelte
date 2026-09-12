<script>
  export let tierlist;
  export let timeAgo;
  export let onOpen = () => {};
  export let onVote = (dir) => {};
</script>

<div
  class="cursor-pointer"
  on:click={onOpen}
  role="button"
  tabindex="0"
  on:keydown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') onOpen();
  }}
>
  <div class="flex items-center gap-3 mb-3">
    {#if tierlist.author.pfp}
      <img
        src={tierlist.author.pfp}
        alt={tierlist.author.nama}
        class="w-9 h-9 rounded-full object-cover border border-gray-200 shrink-0"
      />
    {:else}
      <div class="w-9 h-9 rounded-full bg-gray-400 flex items-center justify-center shrink-0">
        <span class="text-sm font-bold text-white">
          {tierlist.author.nama.charAt(0).toUpperCase()}
        </span>
      </div>
    {/if}

    <div>
      <p class="text-sm font-bold text-gray-800">{tierlist.author.nama}</p>
      <p class="text-xs text-gray-400">{timeAgo(tierlist.createdAt)}</p>
    </div>
  </div>

  {#if tierlist.image}
    <div class="w-full mb-3 rounded-xl overflow-hidden bg-gray-100 border border-gray-100">
      <img
        src={tierlist.image}
        alt="Tier list"
        class="w-full max-h-[420px] object-contain"
      />
    </div>
  {/if}

  <div class="flex items-start justify-between gap-4">
    <p class="text-sm text-gray-700 leading-relaxed">
      <span class="font-bold text-gray-900">{tierlist.author.nama}</span>
      <span> - {tierlist.content}</span>
    </p>

    <div
      class="flex items-center gap-1 shrink-0"
      on:click|stopPropagation
      role="presentation"
    >
      <button
        on:click={() => onVote(1)}
        class="p-1.5 rounded-md transition-colors {tierlist.myVote === 1
          ? 'text-orange-600 bg-orange-50'
          : 'text-gray-400 hover:bg-gray-100'}"
        title="Upvote"
      >
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 3l7 7h-4v7H7v-7H3l7-7z" />
        </svg>
      </button>

      <span class="text-xs font-bold text-gray-600 min-w-[1.4rem] text-center">
        {tierlist.likeCount}
      </span>

      <button
        on:click={() => onVote(-1)}
        class="p-1.5 rounded-md transition-colors {tierlist.myVote === -1
          ? 'text-blue-600 bg-blue-50'
          : 'text-gray-400 hover:bg-gray-100'}"
        title="Downvote"
      >
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 17l-7-7h4V3h6v7h4l-7-7z" />
        </svg>
      </button>
    </div>
  </div>
</div>