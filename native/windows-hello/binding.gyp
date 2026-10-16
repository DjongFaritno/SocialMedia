{
  "targets": [
    {
      "target_name": "duochat_hello",
      "sources": [
        "hello.cc"
      ],
      "defines": [
        "NAPI_VERSION=8",
        "NOMINMAX",
        "WIN32_LEAN_AND_MEAN"
      ],
      "win_delay_load_hook": "true",
      "msvs_settings": {
        "VCCLCompilerTool": {
          "ExceptionHandling": 1,
          "AdditionalOptions": [
            "/std:c++20",
            "/permissive-"
          ]
        },
        "VCLinkerTool": {
          "AdditionalDependencies": [
            "windowsapp.lib",
            "runtimeobject.lib"
          ]
        }
      }
    }
  ]
}
