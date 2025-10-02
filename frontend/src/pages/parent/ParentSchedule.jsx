import Schedule from '../../components/common/schedule/Schedule';

const ParentSchedule = ({ user }) => {
  return <Schedule user={user} userRole="parent" />;
};

export default ParentSchedule;
