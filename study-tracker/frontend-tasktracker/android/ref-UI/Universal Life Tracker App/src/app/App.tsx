import { useState } from 'react';
import { Dashboard } from '@/app/components/dashboard';
import { Tasks } from '@/app/components/tasks';
import { Timesheet } from '@/app/components/timesheet';
import { Profile } from '@/app/components/profile';
import { BottomNav } from '@/app/components/bottom-nav';
import { FloatingActionButton } from '@/app/components/floating-action-button';
import { AddSessionModal } from '@/app/components/add-session-modal';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalPrefilledTitle, setModalPrefilledTitle] = useState('');

  const handleOpenModal = (taskId?: string) => {
    // If taskId is provided, you could fetch the task and prefill the modal
    setModalPrefilledTitle(taskId ? 'Task Title' : '');
    setIsModalOpen(true);
  };

  const handleAddTask = (type: string) => {
    console.log('Add task type:', type);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen dark">
      {/* Main Content */}
      <div className="relative">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'tasks' && <Tasks onOpenModal={handleOpenModal} />}
        {activeTab === 'timesheet' && <Timesheet />}
        {activeTab === 'profile' && <Profile />}
      </div>

      {/* FAB - Show only on Tasks tab */}
      {activeTab === 'tasks' && (
        <FloatingActionButton onAddTask={handleAddTask} />
      )}

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Add Session Modal */}
      <AddSessionModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        prefilledTitle={modalPrefilledTitle}
      />
    </div>
  );
}

export default App;
