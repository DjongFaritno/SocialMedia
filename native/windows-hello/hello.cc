// Windows-owned user verification. No biometric templates, PINs or passwords
// cross this boundary. N-API keeps the binding independent of the V8 ABI.
#include <node_api.h>
#include <windows.h>
#include <roapi.h>
#include <userconsentverifierinterop.h>
#include <winrt/Windows.Foundation.h>
#include <winrt/Windows.Security.Credentials.UI.h>
#include <cstring>
#include <string>
using namespace winrt::Windows::Security::Credentials::UI;
struct Task {
 napi_deferred deferred{}; napi_async_work work{}; HWND owner{}; bool verify{};
 std::string result = "UnknownError";
};
static std::string Availability(UserConsentVerifierAvailability value) {
 switch(value) {
 case UserConsentVerifierAvailability::Available: return "Available";
 case UserConsentVerifierAvailability::DeviceNotPresent: return "DeviceNotPresent";
 case UserConsentVerifierAvailability::NotConfiguredForUser: return "NotConfiguredForUser";
 case UserConsentVerifierAvailability::DisabledByPolicy: return "DisabledByPolicy";
 case UserConsentVerifierAvailability::DeviceBusy: return "DeviceBusy";
 default: return "UnknownError";
 }
}
static std::string Verification(UserConsentVerificationResult value) {
 switch(value) {
 case UserConsentVerificationResult::Verified: return "Verified";
 case UserConsentVerificationResult::DeviceNotPresent: return "DeviceNotPresent";
 case UserConsentVerificationResult::NotConfiguredForUser: return "NotConfiguredForUser";
 case UserConsentVerificationResult::DisabledByPolicy: return "DisabledByPolicy";
 case UserConsentVerificationResult::DeviceBusy: return "DeviceBusy";
 case UserConsentVerificationResult::RetriesExhausted: return "RetriesExhausted";
 case UserConsentVerificationResult::Canceled: return "Canceled";
 default: return "UnknownError";
 }
}
static bool ValidOwner(HWND owner) {
 DWORD pid = 0; GetWindowThreadProcessId(owner, &pid);
 return IsWindow(owner) && IsWindowVisible(owner) && pid == GetCurrentProcessId();
}
static void Execute(napi_env, void* data) {
 auto task = static_cast<Task*>(data);
 HRESULT apartment = RoInitialize(RO_INIT_MULTITHREADED);
 if (FAILED(apartment)) return;
 try {
  if (!task->verify) task->result = Availability(UserConsentVerifier::CheckAvailabilityAsync().get());
  else if (!ValidOwner(task->owner)) task->result = "InvalidWindow";
  else {
   auto interop = winrt::get_activation_factory<UserConsentVerifier, IUserConsentVerifierInterop>();
   winrt::Windows::Foundation::IAsyncOperation<UserConsentVerificationResult> operation{nullptr};
   winrt::hstring reason{L"Buka ruang ngobrolmu di DuoChat"};
   winrt::check_hresult(interop->RequestVerificationForWindowAsync(
    task->owner, winrt::get_abi(reason),
    winrt::guid_of<winrt::Windows::Foundation::IAsyncOperation<UserConsentVerificationResult>>(),
    winrt::put_abi(operation)));
   task->result = Verification(operation.get());
  }
 } catch (...) { task->result = "UnknownError"; }
 RoUninitialize();
}
static void Complete(napi_env env, napi_status status, void* data) {
 auto task = static_cast<Task*>(data); napi_value value;
 const auto result = status == napi_ok ? task->result : std::string("Canceled");
 if (napi_create_string_utf8(env, result.c_str(), result.size(), &value) == napi_ok)
  napi_resolve_deferred(env, task->deferred, value);
 napi_delete_async_work(env, task->work); delete task;
}
static napi_value Start(napi_env env, napi_callback_info info, bool verify) {
 auto task = new Task(); task->verify = verify;
 if (verify) {
  size_t argc = 1, size = 0; napi_value args[1]; void* bytes = nullptr; bool buffer = false;
  if (napi_get_cb_info(env, info, &argc, args, nullptr, nullptr) != napi_ok || argc != 1 ||
      napi_is_buffer(env, args[0], &buffer) != napi_ok || !buffer ||
      napi_get_buffer_info(env, args[0], &bytes, &size) != napi_ok || size != sizeof(HWND)) {
   delete task; napi_throw_type_error(env, nullptr, "A native DuoChat window handle is required"); return nullptr;
  }
  std::memcpy(&task->owner, bytes, sizeof(HWND));
  if (!ValidOwner(task->owner) || GetForegroundWindow() != task->owner) {
   delete task; napi_throw_error(env, nullptr, "DuoChat must be the active window"); return nullptr;
  }
 }
 napi_value promise, name;
 if (napi_create_promise(env, &task->deferred, &promise) != napi_ok ||
     napi_create_string_utf8(env, "DuoChat Windows Hello", NAPI_AUTO_LENGTH, &name) != napi_ok ||
     napi_create_async_work(env, nullptr, name, Execute, Complete, task, &task->work) != napi_ok) {
  delete task; napi_throw_error(env, nullptr, "Cannot create Windows Hello request"); return nullptr;
 }
 if (napi_queue_async_work(env, task->work) != napi_ok) {
  napi_delete_async_work(env, task->work); delete task;
  napi_throw_error(env, nullptr, "Cannot queue Windows Hello request"); return nullptr;
 }
 return promise;
}
static napi_value Check(napi_env env, napi_callback_info info) { return Start(env, info, false); }
static napi_value Verify(napi_env env, napi_callback_info info) { return Start(env, info, true); }
NAPI_MODULE_INIT() {
 napi_property_descriptor methods[] = {
  {"checkAvailability", nullptr, Check, nullptr, nullptr, nullptr, napi_default, nullptr},
  {"verify", nullptr, Verify, nullptr, nullptr, nullptr, napi_default, nullptr}
 };
 if (napi_define_properties(env, exports, 2, methods) != napi_ok) return nullptr;
 return exports;
}
