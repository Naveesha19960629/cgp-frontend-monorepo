import { Outlet } from 'react-router-dom';

export default function MainLayout() {
  return (
    <div>
      <div>
        <p>sidebar</p>
        <Outlet />
      </div>
    </div>
  );
}
