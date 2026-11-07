<template>
  <div
    aria-hidden="true"
    class="pointer-events-none absolute inset-x-0 top-1/2 -z-10 mx-auto hidden h-[440px] max-w-[1120px] -translate-y-1/2 lg:block"
  >
    <svg
      viewBox="0 0 1120 440"
      fill="none"
      class="h-full w-full text-text-primary"
      xmlns="http://www.w3.org/2000/svg"
    >
      <!-- A single baseline connects the two quiet, editorial vignettes. -->
      <path d="M30 385H1090" class="stroke-border" />
      <g stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
        <path d="M105 126c24 24 40-40 51-25s-8 38-20 24 33-66 43-41 12 35 35 21" />
        <circle cx="221" cy="78" r="3" />
        <circle cx="263" cy="218" r="5" />
        <path d="M125 175h94v65h-72l-22 22z" class="fill-background stroke-text-secondary" />
        <path d="M143 195h58m-58 18h39" class="stroke-text-secondary" />
        <path d="M204 385v-81h70v81" class="fill-surface stroke-text-secondary" />
        <path d="M225 368c18-10 26-29 24-47m-6 7 6-8 7 8" class="stroke-text-secondary" />
        <path d="M286 302c19 24 36-15 25-14s-3 33 20 14l29-27" class="stroke-text-secondary" />
      </g>
      <path d="M119 255h69v130h-69z" class="fill-primary" />
      <g fill="currentColor">
        <circle
          v-for="n in 15"
          :key="n"
          :cx="130 + ((n - 1) % 3) * 22"
          :cy="268 + Math.floor((n - 1) / 3) * 26"
          r="3"
        />
      </g>

      <!-- A résumé sheet, pencil and a small stack of paper. -->
      <g stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
        <path d="M859 385v-65h89v65" class="fill-surface stroke-text-secondary" />
        <path d="M970 385V267h62v118" class="fill-primary stroke-primary" />
        <path
          d="M820 139c17 13 33-7 26-14s-9 22 10 22 25-37 36-26 9 24 27 18"
          class="stroke-text-secondary"
        />
        <circle cx="932" cy="110" r="3" />
        <path d="m809 188 107-17 22 140-107 17z" class="fill-surface" />
        <circle cx="841" cy="210" r="11" class="fill-primary stroke-primary" />
        <path
          d="m863 201 35-5m-34 14 25-4m-45 39 58-9m-56 20 65-10m-63 22 54-9m-52 21 63-10m-61 22 37-6"
          class="stroke-text-secondary"
        />
        <path d="m950 184 10-4 30 103-2 20-12-16z" class="fill-primary" />
        <path d="m976 287 14-4m-2 20-5-7" />
        <path d="M791 358c-20-22-22-38-12-39s9 26-4 20-21-35-13-46" class="stroke-text-secondary" />
      </g>
      <g fill="currentColor">
        <circle
          v-for="n in 12"
          :key="n"
          :cx="982 + ((n - 1) % 3) * 19"
          :cy="281 + Math.floor((n - 1) / 3) * 28"
          r="3"
        />
      </g>
    </svg>
  </div>
</template>
