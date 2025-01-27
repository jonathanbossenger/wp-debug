module.exports = {
  packagerConfig: {
    asar: true,
    name: 'WP Debug',
    executableName: 'wp-debug',
    icon: './assets/icons/icon',
    appBundleId: 'com.wp-debug.app',
    appCategoryType: 'public.app-category.developer-tools',
    protocols: [
      {
        name: 'WP Debug',
        schemes: ['wp-debug']
      }
    ]
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'wp-debug',
        iconUrl: './assets/icons/icon.ico',
        setupIcon: './assets/icons/icon.ico'
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin', 'linux'],
      config: {
        icon: './assets/icons/icon.icns'
      }
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          icon: './assets/icons/icon.png',
          name: 'wp-debug',
          productName: 'WP Debug',
          categories: ['Development']
        }
      },
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {
        options: {
          icon: './assets/icons/icon.png',
          name: 'wp-debug',
          productName: 'WP Debug',
          categories: ['Development']
        }
      },
    },
  ],
}; 
