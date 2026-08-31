self.__BUILD_MANIFEST = {
  "__rewrites": {
    "afterFiles": [
      {
        "source": "/auth/:path*"
      },
      {
        "source": "/users/:path*"
      },
      {
        "source": "/profiles/:path*"
      },
      {
        "source": "/suppliers/:path*"
      },
      {
        "source": "/api/:path*"
      }
    ],
    "beforeFiles": [],
    "fallback": []
  },
  "sortedPages": [
    "/_app",
    "/_error"
  ]
};self.__BUILD_MANIFEST_CB && self.__BUILD_MANIFEST_CB()