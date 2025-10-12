import React, { useEffect, useState ,useRef} from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputSwitch } from "primereact/inputswitch";
import { OverlayPanel } from 'primereact/overlaypanel';
import { Button } from 'primereact/button';
import { Paginator } from 'primereact/paginator';

interface Artwork {
  title: string;
  date_start: number;
  date_end: number;
  artist_display: string;
  place_of_origin: string;
  inscriptions: string;
  id: number;
}

const API_URL = "https://api.artic.edu/api/v1/artworks"

const ArtTable: React.FC = () => {
  const [data, setData] = useState<Artwork[]>([]);
  const [selecteddata, setSelectedData] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [rowClick, setRowClick] = useState(true);
  const op = useRef<OverlayPanel>(null);
  const [count,setCount]=useState("");
  const [page,setPage]=useState("1");
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [first, setFirst] = useState(0);
  
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchPage(Number(page));
  }, [page,setSelectedData]);

  const fetchPage = async (page: number): Promise<void> => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}?page=${page}`);
      if (!response.ok) throw new Error("Api request failed");

      const json = await response.json();
      const items: Artwork[] =
        json.data?.map((item: any) => ({
          title: item.title ,
          date_start: item.date_start,
          date_end: item.date_end,
          artist_display: item.artist_display,
          place_of_origin: item.place_of_origin,
          inscriptions: item.inscriptions,
          id: item.id,
        }));

      setData(items);
      setTotalRecords(json.pagination?.total ?? 100);
      const selectedOnPage = items.filter(row => selectedIds.has(row.id));
      setSelectedData(selectedOnPage);

    } catch (err) {
      console.error("Failed to load page :", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const onRowSelected = async (cnt: number) => {
    let remaining = cnt - selectedIds.size; 
    if (remaining <= 0) return; 
    const newIds = new Set(selectedIds);
    let currentPage = 1;
    while (remaining > 0) {
        const response = await fetch(`${API_URL}?page=${currentPage}`);
        if (!response.ok) break;

        const json = await response.json();
        const items: Artwork[] = json.data.map((item: any) => ({
            title: item.title,
            date_start: item.date_start,
            date_end: item.date_end,
            artist_display: item.artist_display,
            place_of_origin: item.place_of_origin,
            inscriptions: item.inscriptions,
            id: item.id
        }));
        for (let i = 0; i < items.length && remaining > 0; i++) {
            newIds.add(items[i].id);
            remaining--;
        }
        currentPage++;
        if (!json.pagination?.total_pages || currentPage > json.pagination.total_pages) break;
    }

    setSelectedIds(newIds);
    setSelectedData(data.filter(row => newIds.has(row.id)));
    op.current?.hide();
};
  const onPageChange = (event: any) => {
    setFirst(event.first);
    setPage(String(Math.floor(event.first / event.rows) + 1)); 
  };

  return (
    <div className="card">
      <div className="flex justify-content-center align-items-center mb-4 gap-2">
        <InputSwitch inputId="input-rowclick" checked={rowClick} onChange={(e) => setRowClick(e.value)} />
        <label htmlFor="input-rowclick">Row Click</label>
      </div>
      <DataTable
        value={data}
        loading={loading}
        dataKey="id"
        tableStyle={{ minWidth: '50rem' }}
        selectionMode={rowClick ? null : 'checkbox'}
        selection={selecteddata}
        onSelectionChange={(e:any) => {
          const newIds = new Set(selectedIds);
          e.value.forEach((row: Artwork) => newIds.add(row.id));
          data.forEach(row => {
            if (!e.value.find((r: Artwork) => r.id === row.id)) {
              newIds.delete(row.id);
            }
          });
          setSelectedIds(newIds);
          setSelectedData(data.filter(row => newIds.has(row.id)));
        }}
      >

        <Column selectionMode="multiple" headerStyle={{ width: '3rem' }}></Column>
        <Column header={
          <>
            <Button
              type="button"
              icon="pi pi-angle-down"
              onClick={(e) => op.current?.toggle(e)}
            />
            <OverlayPanel ref={op} style={{ padding: '1em', width: '250px' }} >
              <input
                type="text"
                placeholder="ROWS TO BE SELECTED"
                value={count}
                onChange={(e)=>setCount(e.target.value)} 
              />
              <Button
                type="button"
                icon="submit"
                label="submit"
                onClick={() => {
                  if (count) {
                    onRowSelected(Number(count));
                  }
                }}
              />
            </OverlayPanel>
          </>
        }/>
        <Column field="place_of_origin" header="placeOfOrigin"  />
        <Column field="artist_display" header="Artist" />
        <Column field="title" header="Title" />
        <Column field="inscriptions" header="Inscriptions" />
        <Column field="date_start" header="Started" />
        <Column field="date_end" header="Completed" />
      </DataTable>

      <Paginator
        first={first}
        rows={12}
        totalRecords={totalRecords}
        onPageChange={onPageChange}
        className="mt-3"
      />
    </div>
  );
};

export default ArtTable;
