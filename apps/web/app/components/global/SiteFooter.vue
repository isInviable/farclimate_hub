<template>
  <footer class="bg-neutral-darkest text-neutral-lightest py-20">
    <div class="container mx-auto max-w-7xl">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-16">
        <div>
          <div class="h-9 w-20 bg-white/10 rounded mb-6"></div>
          <p class="typo-body max-w-xl">Join our newsletter to stay up to date on features and releases.</p>
          <div class="mt-4 flex gap-3">
            <UInput placeholder="Enter your email" class="w-64" />
            <UButton variant="ghost" class="border border-neutral-lightest/80 text-neutral-lightest">Subscribe</UButton>
          </div>
          <p class="text-[12px] mt-3 opacity-80">By subscribing you agree to our Privacy Policy.</p>
        </div>
        <div class="grid grid-cols-2 gap-10">
          <div>
            <p class="font-mono font-semibold mb-2">Main menu</p>
            <ul class="space-y-2 text-[14px]">
              <li>About</li>
              <li>Stories</li>
              <li>Solutions</li>
              <li>Skills</li>
              <li>Connected Action</li>
            </ul>
          </div>
          <div>
            <p class="font-mono font-semibold mb-2">Follow Us</p>
            <ul class="space-y-2 text-[14px]">
              <li>Facebook</li>
              <li>Instagram</li>
              <li>X</li>
              <li>LinkedIn</li>
              <li>Youtube</li>
            </ul>
          </div>
        </div>
      </div>
      <div class="mt-10 border-t border-neutral-lightest/20 pt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-[14px]">
        <p>© 2025 Transformation HUB. All rights reserved.</p>
        <div class="flex gap-6 underline">
          <a>Privacy Policy</a>
          <a>Terms of Service</a>
          <a>Cookies Settings</a>
        </div>
      </div>
    </div>
  </footer>
</template>

<script lang="ts" setup>

</script>

<style>

</style>

