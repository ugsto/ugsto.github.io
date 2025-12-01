<script lang="ts">
  import type { SocialLink } from "$lib/home/domain/models";
  export let link: SocialLink;
</script>

<a
  href={link.url}
  target={link.url.startsWith("mailto") ? "_self" : "_blank"}
  rel="noopener noreferrer"
  class="group flex flex-col items-center p-8 rounded-2xl bg-slate-900/50 border border-slate-800 hover:bg-slate-800 transition-all duration-300 outline-none focus-visible:ring-2 {link
    .styles.containerHoverBorder} {link.styles.ringColor}"
>
  <svg
    class="w-16 h-16 mb-6 text-slate-400 transition-colors duration-300 {link
      .styles.iconHoverColor}"
    fill={link.platform === "Email" ? "none" : "currentColor"}
    stroke={link.platform === "Email" ? "currentColor" : "none"}
    stroke-width={link.platform === "Email" ? "1.5" : "0"}
    stroke-linecap="round"
    stroke-linejoin="round"
    viewBox="0 0 24 24"
  >
    <path d={link.svgPath} />
  </svg>

  <h3 class="text-xl font-bold text-slate-100 mb-2">{link.platform}</h3>
  <span class="font-mono text-sm text-slate-400">{link.handle}</span>
</a>
