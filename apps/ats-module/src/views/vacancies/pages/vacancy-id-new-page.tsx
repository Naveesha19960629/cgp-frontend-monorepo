import { useParams } from 'react-router-dom';

export default function VacancyIdNewPage() {
  const { id } = useParams<{ id: string }>();

  return <div>Vacancy {id} - New</div>;
}
