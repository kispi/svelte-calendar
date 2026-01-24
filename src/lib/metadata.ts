export const metadata = {
  siteName: 'Swiftly by Gravex',
  title: 'Swiftly - Lightning Fast Calendar & Notes',
  description: 'Lightning-fast smart calendar & notes. Feather-light design. Built on Svelte for blazing performance.',
  url: 'https://gravex.app',
  image: '/logo.png',

  // Dynamic title generator
  getPageTitle: (section?: string) => {
    if (!section) return 'Swiftly by Gravex'
    return `${section} | Swiftly by Gravex`
  }
}
