import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { getEducationModuleById, getEducationProgress, markLessonCompleted, saveQuizScore, calculateModuleProgress } from '../services/educationEngine';
import { Sparkles, BookOpen, Activity, Heart, Shield, CheckCircle, AlertTriangle, ArrowLeft, ArrowRight, Circle } from 'lucide-react';
import MagnifyingLoader from './MagnifyingLoader';

const EducationModule = () => {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [module, setModule] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(null);

  useEffect(() => {
    const loadModuleAndProgress = async () => {
      try {
        setLoading(true);
        const moduleData = await getEducationModuleById(moduleId);
        if (!moduleData) {
          throw new Error('Module not found');
        }
        setModule(moduleData);
        if (user) {
          const userProgress = await getEducationProgress(user.id, moduleId);
          setProgress(userProgress);
        }
      } catch (err) {
        console.error('Error loading module:', err);
        setError('Failed to load module. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadModuleAndProgress();
  }, [moduleId, user]);

  useEffect(() => {
    if (module) {
      setCurrentLessonIndex(0);
      setQuizAnswers({});
      setQuizSubmitted(false);
      setQuizScore(null);
    }
  }, [module]);

  const handleCompleteLesson = async () => {
    if (!user) return;
    const lessonId = module.lessons[currentLessonIndex].id;
    await markLessonCompleted(user.id, moduleId, lessonId);
    const updatedProgress = await getEducationProgress(user.id, moduleId);
    setProgress(updatedProgress);
  };

  const handleQuizAnswerChange = (lessonId, answerIndex) => {
    setQuizAnswers(prev => ({
      ...prev,
      [lessonId]: answerIndex
    }));
  };

  const handleQuizSubmit = async () => {
    if (!user) return;
    const lessonId = module.lessons[currentLessonIndex].id;
    const answerIndex = quizAnswers[lessonId];
    const correctAnswer = module.lessons[currentLessonIndex].quiz[0].correctAnswer;
    const score = answerIndex === correctAnswer ? 100 : 0;
    await saveQuizScore(user.id, moduleId, lessonId, score);
    setQuizScore(score);
    setQuizSubmitted(true);
  };

  const getModuleProgressPercentage = async () => {
    if (!user || !moduleId) return 0;
    return await calculateModuleProgress(user.id, moduleId);
  };

   if (loading) {
     return (
       <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
         <div className="text-center">
           <MagnifyingLoader size={32} />
           <h2 className="text-xl font-bold text-slate-100">Loading module...</h2>
         </div>
       </motion.div>
     );
   }

  if (error || !module) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle size={32} className="mb-4 text-amber-400" />
          <h2 className="text-xl font-bold text-slate-100">Error</h2>
          <p className="text-slate-400">{error || 'Module not found'}</p>
          <button onClick={() => navigate('/education')} className="mt-4 btn-primary px-6 py-2">
            Back to Education
          </button>
        </div>
      </motion.div>
    );
  }

  const currentLesson = module.lessons[currentLessonIndex];
  const hasQuiz = currentLesson.quiz && currentLesson.quiz.length > 0;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="min-h-[calc(100vh-4rem)] p-6">
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate('/education')} className="text-sm text-teal-400 hover:text-teal-300 flex items-center gap-2">
              <ArrowLeft size={20} className="text-teal-400" />
              Back to Modules
            </button>
            <div className="text-sm text-slate-500">
              Lesson {currentLessonIndex + 1} of {module.lessons.length}
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-100">{module.title}</h1>
          <p className="text-slate-400">{module.description}</p>
          <div className="w-full bg-slate-700/50 rounded-full h-2.5 overflow-hidden">
            <motion.div className="h-full bg-gradient-to-r from-teal-400 to-cyan-400 transition-all duration-500" style={{ width: `${currentLessonIndex / module.lessons.length * 100}%` }} />
          </div>
          <p className="text-sm text-slate-500 mt-1">{(currentLessonIndex / module.lessons.length * 100).toFixed(0)}% through module</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="glass-card p-6">
            <h2 className="text-xl font-medium text-slate-100 mb-4">{currentLesson.title}</h2>
            <div className="prose prose-slate max-w-none text-slate-200">
              {currentLesson.content.split('\n\n').map((paragraph, index) => (
                <p key={index} className="mb-4">{paragraph}</p>
              ))}
            </div>
          </div>

          {hasQuiz && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="glass-card p-6">
                <h2 className="text-lg font-medium text-slate-100 mb-4">Quiz</h2>
                {currentLesson.quiz.map((q, qIndex) => (
                  <div key={qIndex} className="space-y-4">
                    <p className="text-slate-200 font-medium">{q.question}</p>
                    <div className="space-y-2">
                      {q.options.map((option, optIndex) => (
                        <label key={optIndex} className="flex items-center gap-3 p-3 glass-card rounded-lg cursor-pointer hover:bg-slate-700/50 transition-colors">
                          <input
                            type="radio"
                            name={`quiz-${qIndex}`}
                            value={optIndex}
                            checked={quizAnswers[currentLesson.id] === optIndex}
                            onChange={(e) => handleQuizAnswerChange(currentLesson.id, Number(e.target.value))}
                            disabled={quizSubmitted}
                            className="h-4 w-4 text-teal-400"
                          />
                          <span className="text-slate-200">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                {!quizSubmitted && (
                  <button onClick={handleQuizSubmit} className="mt-4 btn-primary px-6 py-3">Submit Quiz</button>
                )}
                {quizSubmitted && quizScore !== null && (
                  <div className="mt-4 p-4 glass-card text-center">
                    {quizScore === 100 ? (
                      <>
                        <CheckCircle size={32} className="mb-3 text-emerald-400" />
                        <p className="font-medium text-slate-100">Quiz passed!</p>
                        <p className="text-slate-400">You scored {quizScore}%</p>
                      </>
                    ) : (
                      <>
                        <AlertTriangle size={32} className="mb-3 text-amber-400" />
                        <p className="font-medium text-slate-100">Quiz not passed</p>
                        <p className="text-slate-400">You scored {quizScore}%. Try again to improve.</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
            <button
              onClick={() => {
                if (currentLessonIndex < module.lessons.length - 1) {
                  setCurrentLessonIndex(prev => prev + 1);
                  setQuizAnswers({});
                  setQuizSubmitted(false);
                  setQuizScore(null);
                }
              }}
              disabled={currentLessonIndex >= module.lessons.length - 1}
              className="px-4 py-2 text-sm font-medium bg-teal-500/20 text-teal-400 rounded hover:bg-teal-500/30 transition-colors"
            >
              {currentLessonIndex < module.lessons.length - 1 ? 'Next Lesson' : 'Complete Module'}
              <ArrowRight size={20} className="ml-2" />
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={handleCompleteLesson}
                disabled={!user || (progress && progress.completedLessons && progress.completedLessons.includes(currentLesson.id))}
                className="px-4 py-2 text-sm font-medium bg-slate-700/20 text-slate-400 rounded hover:bg-slate-700/30 transition-colors"
              >
                {progress && progress.completedLessons && progress.completedLessons.includes(currentLesson.id) ? (
                  <>
                    <CheckCircle size={20} className="mr-2" />
                    Completed
                  </>
                ) : (
                  <>
                    <Circle size={20} className="mr-2" />
                    Mark Complete
                  </>
                )}
              </button>
              <span className="text-xs text-slate-500">
                {progress && progress.completedLessons ? `${progress.completedLessons.length}/${module.lessons.length} lessons completed` : `0/${module.lessons.length} lessons completed`}
              </span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default EducationModule;
