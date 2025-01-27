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
        icon: './assets/icons/icon.ico',
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
    {
      name: '@electron-forge/maker-wix',
      config: {
        language: 1033,
        manufacturer: 'Jonathan Bossenger',
        icon: './assets/icons/icon.ico',
        ui: {
          chooseDirectory: true
        }
      }
    },
    {
      name: '@electron-forge/maker-dmg',
      config: {
        format: 'ULFO',
        background: './assets/dmg-background.png',
        icon: './assets/icons/icon.icns'
      }
    },
    {
      name: '@electron-forge/maker-flatpak',
      config: {
        options: {
          categories: ['Utility'],
          mimeType: ['x-scheme-handler/myapp'],
          icon: './assets/icons/icon.png'
        }
      }
    },
    {
      name: '@electron-forge/maker-snap',
      config: {
        features: {
          audio: true,
          webgl: true
        },
        confinement: 'strict',
        grade: 'stable'
      }
    }
  ],
}; 
