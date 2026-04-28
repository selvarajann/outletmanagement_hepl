import TablePagination from "../shared/TablePagination";

export default function DivisionPagination({ page, totalPages, onPageChange }) {
  return <TablePagination page={page} totalPages={totalPages} onPageChange={onPageChange} />;
}
