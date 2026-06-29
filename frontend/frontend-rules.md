# React Design Patterns — Best Practice (Generic, untuk Boilerplate)

Panduan pattern React yang mencakup 3 pilar utama: **Readability**, **Scalability/Modularity**, dan **Testability**. Semua contoh dibuat generic supaya bisa jadi dasar boilerplate untuk project apapun ke depannya.

---

## 1. Code Readability & Clarity

### a) Custom Hooks untuk extract logic dari komponen

Komponen harus fokus ke "apa yang dirender", bukan "bagaimana data didapat/diproses".

```jsx
// ❌ Logic numpuk di komponen
function ItemList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch("/api/items")
      .then((r) => r.json())
      .then((data) => {
        setItems(data);
        setLoading(false);
      });
  }, []);
  // ...render
}

// ✅ Logic dipisah ke hook
function useItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchItems().then((data) => {
      setItems(data);
      setLoading(false);
    });
  }, []);
  return { items, loading };
}

function ItemList() {
  const { items, loading } = useItems();
  if (loading) return <Spinner />;
  return items.map((item) => <ItemCard key={item.id} item={item} />);
}
```

Efeknya: komponen jadi ringkas, gampang dibaca, dan hook-nya bisa dipakai ulang di tempat lain.

### b) Container/Presentational split (smart vs dumb component)

- **Container**: ngurus data fetching, state, side effect.
- **Presentational**: cuma terima props, render UI, gak tau dari mana datanya.

```jsx
// Container — tau soal data source, API, state
function ItemListContainer() {
  const { items, loading, error } = useItems();
  return <ItemListView items={items} loading={loading} error={error} />;
}

// Presentational — cuma render, gak tau dari mana data datang
function ItemListView({ items, loading, error }) {
  if (loading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;
  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}
```

Manfaat: `ItemListView` jadi gampang dipakai ulang, gampang ditest, dan gak peduli backend-nya pakai REST, GraphQL, atau apapun.

### c) Naming & struktur file konsisten

```
components/
  ItemList/
    ItemList.tsx
    ItemList.test.tsx
    ItemList.module.css
    index.ts
```

`index.ts` cuma re-export, jadi import-nya bersih:

```js
import { ItemList } from "@/components/ItemList";
```

### d) Hindari conditional rendering bertingkat (nested ternary)

```jsx
// ❌
{
  loading ? (
    <Spinner />
  ) : error ? (
    <ErrorMsg />
  ) : data ? (
    <Table data={data} />
  ) : (
    <Empty />
  );
}

// ✅ pakai early return atau komponen status terpisah
if (loading) return <Spinner />;
if (error) return <ErrorMsg error={error} />;
if (!data) return <Empty />;
return <Table data={data} />;
```

---

## 2. Scalable, Modular, Mudah Didevelop Kembali

### a) Feature-based folder structure (bukan type-based)

```
// ❌ type-based — gampang berantakan kalau project gede
src/
  components/
  hooks/
  utils/

// ✅ feature-based — semua yang related satu fitur, nempel
src/
  features/
    auth/
      components/
      hooks/
      api/
      types.ts
    item/
      components/
      hooks/
      api/
      types.ts
  shared/        // benar-benar generic, dipakai semua fitur
    components/   // Button, Modal, Input, dll
    hooks/        // useDebounce, useLocalStorage, dll
    lib/          // axios instance, query client, dll
```

Manfaat: developer (termasuk kamu sendiri di masa depan) bisa kerja di `features/item` tanpa nyenggol `features/auth`. Coupling antar fitur jadi minim — ini juga fondasi paling penting kalau mau dijadikan boilerplate.

### b) Compound Components Pattern

Untuk komponen kompleks yang punya banyak bagian tapi share state internal.

```jsx
<Modal>
  <Modal.Header>Judul Modal</Modal.Header>
  <Modal.Body>Konten di sini</Modal.Body>
  <Modal.Footer>
    <Modal.CancelButton />
    <Modal.ConfirmButton onConfirm={handleConfirm} />
  </Modal.Footer>
</Modal>
```

Internal-nya pakai Context biar `Modal.Header`, `Modal.Body`, dll bisa akses state yang sama tanpa prop drilling. Pattern ini bagus untuk komponen `shared/` di boilerplate karena fleksibel dipakai ulang.

### c) Hindari prop drilling dengan Context + state management yang tepat

Aturan praktis:

| Skala state                   | Solusi                                 |
| ----------------------------- | -------------------------------------- |
| Lokal ke 1 komponen           | `useState`                             |
| Dishare 2–3 level             | Lift up state / Context                |
| Global app-wide (auth, theme) | Context atau lib (Zustand/Redux/Jotai) |

> Jangan taruh semua state ke global state — itu anti-pattern yang bikin susah trace bug.

### d) Composition over configuration

```jsx
// ❌ component makin gendut karena nambah props terus
<Button variant="primary" icon="check" iconPosition="left" loading={true} />

// ✅ compose dari komponen kecil
<Button>
  <Spinner /> <CheckIcon /> Simpan
</Button>
```

Composition bikin komponen gak perlu "tau semua kemungkinan use case" di awal — lebih scalable buat requirement baru.

### e) Barrel export hati-hati

`index.ts` per folder oke, tapi jangan bikin satu `index.ts` raksasa di root yang re-export semua — bikin bundle splitting jadi sulit dan circular import gampang muncul.

---

## 3. Testing-Friendly

### a) Inject dependency lewat props, jangan hardcode side-effect di dalam komponen

```jsx
// ❌ susah di-mock di test
function SubmitButton() {
  const handleClick = () => apiClient.submitForm();
  return <button onClick={handleClick}>Submit</button>;
}

// ✅ bisa di-mock dengan gampang
function SubmitButton({ onSubmit }) {
  return <button onClick={onSubmit}>Submit</button>;
}
```

### b) Test custom hooks secara terisolasi

Karena logic udah dipisah di hook (poin 1a), hook bisa ditest tanpa perlu render komponen UI sama sekali — pakai `renderHook` dari React Testing Library.

```jsx
const { result } = renderHook(() => useItems());
expect(result.current.loading).toBe(true);
```

### c) Query elemen test berdasarkan behavior, bukan implementasi

```jsx
// ❌ rapuh — break kalau struktur DOM/CSS class berubah
screen.getByClassName("btn-primary");

// ✅ stabil — sesuai apa yang user lihat/lakukan
screen.getByRole("button", { name: /submit/i });
```

Prinsip React Testing Library: **test seperti user pakai aplikasi**, bukan test detail internal komponen.

### d) Pure function untuk business logic

Logic kalkulasi/transformasi data sebaiknya dipisah jadi pure function di luar komponen/hook:

```ts
// utils/formatCurrency.ts — pure, gampang banget ditest
export function formatCurrency(amount: number, currency = "IDR"): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency }).format(
    amount,
  );
}
```

Test-nya tinggal:

```js
expect(formatCurrency(15000)).toBe("Rp15.000");
```

Gak perlu render apapun, gak perlu mock apapun.

### e) Mock di boundary, bukan di tengah

Mock di level network (misal pakai **MSW** — Mock Service Worker) lebih reliable daripada mock function `fetch` manual satu-satu, karena test-nya lebih nyerupai behavior production.

---

## 4. Saran Struktur Boilerplate (From Scratch)

Karena tujuannya bikin boilerplate sendiri, ini contoh struktur folder yang udah ngegabungin semua pattern di atas:

```
src/
  app/                  # entry point, routing, providers (QueryClient, Theme, dll)
    App.tsx
    providers.tsx
    router.tsx

  features/             # 1 folder = 1 domain/fitur
    auth/
      components/
      hooks/
      api/
      types.ts
    item/
      components/
      hooks/
      api/
      types.ts

  shared/               # reusable, gak terikat fitur tertentu
    components/         # Button, Modal, Input, Spinner, dll
    hooks/               # useDebounce, useLocalStorage, dll
    lib/                 # axios/fetch instance, query client config
    utils/               # pure function (formatCurrency, formatDate, dll)
    types/               # tipe global (ApiResponse<T>, dll)

  test/
    setup.ts             # config RTL + jest/vitest
    mocks/                # MSW handlers
```

**Hal-hal yang enak di-bake-in dari awal di boilerplate:**

1. **Path alias** (`@/features`, `@/shared`) — biar import gak `../../../../`.
2. **API client terpusat** di `shared/lib/apiClient.ts` — semua fetch lewat satu pintu, gampang dikasih interceptor (auth token, error handling global).
3. **Query layer** (React Query / TanStack Query) per fitur, taruh di `features/<nama>/api/` — udah include caching & loading state, jadi `useItems()` di poin 1a bisa makin ringkas.
4. **Testing setup siap pakai** (Vitest/Jest + RTL + MSW) supaya nulis test gak perlu setup ulang tiap kali bikin fitur baru.
5. **Lint & format rules** (ESLint + Prettier) yang udah enforce pattern di atas (misal rule no-nested-ternary, import order per layer).

---

## 5. Performance Optimization

### a) Jangan asal pakai `useMemo`/`useCallback`/`React.memo`

Ketiganya ada cost (extra memory, comparison check). Pakai hanya kalau:

- Komputasi memang berat (`useMemo`)
- Function di-passing ke child yang di-wrap `React.memo` (`useCallback`)
- Komponen sering re-render dengan props yang sama (`React.memo`)

```jsx
// Worth it — komputasi berat
const sortedItems = useMemo(() => heavySort(items), [items]);

// Biasanya gak perlu — komputasi ringan, malah nambah overhead
const doubled = useMemo(() => count * 2, [count]); // ❌ overkill
```

### b) Code splitting per route/feature

```jsx
const ItemDetailPage = lazy(
  () => import("@/features/item/pages/ItemDetailPage"),
);

<Suspense fallback={<Spinner />}>
  <ItemDetailPage />
</Suspense>;
```

Manfaat: initial bundle kecil, halaman lain di-load saat dibutuhkan.

### c) Virtualization untuk list panjang

Kalau render ratusan/ribuan item (misal log, tabel besar), pakai `react-window` atau `@tanstack/react-virtual` supaya cuma elemen yang visible di-render ke DOM.

---

## 6. Error Handling & Resilience

### a) Error Boundary

Mencegah satu komponen crash bikin seluruh app blank.

```jsx
class ErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return <FallbackUI />;
    return this.props.children;
  }
}

<ErrorBoundary>
  <ItemList />
</ErrorBoundary>;
```

Taruh boundary di level yang strategis (per page/feature), bukan cuma satu di root — biar crash di satu fitur gak nge-blank-in seluruh app.

### b) Retry & fallback strategy

React Query/TanStack Query udah built-in retry + stale data fallback. Pastikan dikonfigurasi sesuai kebutuhan (jumlah retry, exponential backoff).

### c) Global error reporting

Siapkan integration point ke Sentry (atau sejenisnya) sejak awal boilerplate — termasuk hook ke Error Boundary di atas.

---

## 7. Form Handling Pattern

### a) Controlled vs Uncontrolled

- **Controlled**: value form disimpan di React state, tiap keystroke trigger re-render.
- **Uncontrolled**: value diakses lewat ref, browser yang pegang state-nya.

Untuk form kompleks (validasi, multi-step), controlled lebih predictable — tapi pakai library, jangan handle manual.

### b) React Hook Form + schema validation (Zod)

```jsx
const schema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
});

function ItemForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("name")} />
      {errors.name && <span>{errors.name.message}</span>}
    </form>
  );
}
```

Manfaat: validasi terpisah dari UI (testable sebagai pure schema), re-render minimal (RHF uncontrolled by default), error message konsisten.

---

## 8. Data Fetching & Caching Layer (React Query)

### a) Query key strategy

```js
// Konsisten & predictable, gampang di-invalidate
const itemKeys = {
  all: ["items"],
  detail: (id) => ["items", id],
  list: (filters) => ["items", "list", filters],
};

useQuery({ queryKey: itemKeys.detail(id), queryFn: () => fetchItem(id) });
```

### b) Invalidation setelah mutation

```js
const mutation = useMutation({
  mutationFn: createItem,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: itemKeys.all }),
});
```

### c) Optimistic update (untuk UX yang responsif)

```js
useMutation({
  mutationFn: updateItem,
  onMutate: async (newItem) => {
    await queryClient.cancelQueries({ queryKey: itemKeys.detail(newItem.id) });
    const previous = queryClient.getQueryData(itemKeys.detail(newItem.id));
    queryClient.setQueryData(itemKeys.detail(newItem.id), newItem);
    return { previous };
  },
  onError: (err, newItem, context) => {
    queryClient.setQueryData(itemKeys.detail(newItem.id), context.previous);
  },
});
```

---

## 9. Routing Pattern

### a) Protected route (auth guard)

```jsx
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  return children;
}

<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>;
```

### b) Layout route (nested routes)

```jsx
<Route element={<DashboardLayout />}>
  <Route path="/items" element={<ItemListPage />} />
  <Route path="/items/:id" element={<ItemDetailPage />} />
</Route>
```

`DashboardLayout` render `<Outlet />` untuk child route — sidebar/header gak perlu di-render ulang tiap pindah halaman.

---

## 10. TypeScript-Specific Patterns

### a) Discriminated union untuk state (lebih aman dari banyak boolean)

```ts
// ❌ rawan inconsistent state (loading=true & error=truthy bersamaan)
type State = { loading: boolean; error?: string; data?: Item[] };

// ✅ cuma satu state yang mungkin aktif di satu waktu
type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: Item[] }
  | { status: "error"; error: string };
```

### b) Generic component

```tsx
type ListProps<T> = {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
};

function List<T>({ items, renderItem }: ListProps<T>) {
  return (
    <ul>
      {items.map((item, i) => (
        <li key={i}>{renderItem(item)}</li>
      ))}
    </ul>
  );
}
```

### c) Type-safe API response

```ts
type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function isSuccess<T>(res: ApiResponse<T>): res is { success: true; data: T } {
  return res.success;
}
```

---

## 11. Accessibility (a11y)

Sering dilupakan, tapi murah untuk dibiasakan dari awal:

- Pakai elemen semantik (`<button>`, bukan `<div onClick>`)
- Setiap `<input>` punya `<label>` terkait (atau `aria-label`)
- Pastikan elemen interaktif bisa diakses via keyboard (`tabIndex`, `onKeyDown` untuk custom component)
- Warna kontras cukup, jangan rely on warna doang untuk indikasi error/success

---

## 12. Styling Strategy

| Pendekatan                  | Plus                                | Minus                            |
| --------------------------- | ----------------------------------- | -------------------------------- |
| CSS Modules                 | Scoped otomatis, simple             | Gak ada design token built-in    |
| Tailwind                    | Cepat, consistent spacing/scale     | Class jadi panjang di JSX        |
| styled-components / Emotion | Dynamic styling lewat props gampang | Runtime cost, bundle lebih besar |

Untuk boilerplate, pilih satu di awal dan **konsisten** — campur-campur approach adalah sumber inconsistency terbesar di project jangka panjang.

---

## 13. CI/CD & Tooling

### a) Pre-commit hook (Husky + lint-staged)

```json
// package.json
"lint-staged": {
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"]
}
```

Mencegah kode yang gak lolos lint/format sampai masuk ke commit.

### b) Storybook untuk dokumentasi komponen

Sangat membantu kalau boilerplate dipakai banyak orang — komponen di `shared/components` bisa di-develop & ditest secara isolated tanpa perlu jalanin seluruh app.

---

## Ringkasan Prioritas

| Pattern                                 | Kenapa penting untuk boilerplate                                            |
| --------------------------------------- | --------------------------------------------------------------------------- |
| Custom hooks                            | Memisahkan logic dari UI sejak awal, jadi gampang dipakai ulang             |
| Feature-based folder                    | Struktur paling krusial — menentukan seberapa scalable boilerplate ke depan |
| Pure function untuk logic               | Bagian paling gampang ditest, taruh di `shared/utils`                       |
| Container/Presentational                | Memastikan komponen UI gak terikat ke 1 sumber data                         |
| RTL behavior-based testing              | Standar testing yang konsisten di semua fitur baru                          |
| React Query + query key strategy        | Server state terstandarisasi, gak perlu reinvent tiap fitur                 |
| Error Boundary + global error reporting | App gak gampang blank total saat ada bug di satu fitur                      |
| Form pattern (RHF + Zod)                | Validasi konsisten & testable di semua form baru                            |
| Discriminated union state               | Mencegah state inconsistent (loading & error bersamaan, dll)                |
| Pre-commit hook + Storybook             | Konsistensi kode & dokumentasi komponen otomatis terjaga                    |
