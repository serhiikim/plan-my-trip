import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { ArrowRight, Plane, MessageSquare, Map, Calendar, Clock, Settings, Globe, Camera, Menu, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { auth } from '@/services/auth';
import { useDispatch } from '@/store/store';
import ContactForm from '@/components/ContactForm';

const LandingPage = () => {
    const [activeFeature, setActiveFeature] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const handleSuccess = async (credentialResponse) => {
        try {
            const user = await auth.handleGoogleLogin(credentialResponse.credential);
            dispatch({ type: 'SET_USER', payload: user });
            toast.success('Login successful!');
            navigate('/chat');
        } catch (error) {
            console.error('Login error:', error);
            toast.error('Login failed. Please try again.');
        }
    };

    const handleError = () => {
        console.error('Login Failed');
        toast.error('Login failed. Please try again.');
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white">
            {/* Navigation Header */}
            <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
                <nav className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        <a href="#" className="flex items-center gap-2 text-teal-600 font-bold text-xl">
                            <Globe size={24} />
                            TravelPlanner
                        </a>

                        <div className="hidden md:flex items-center gap-8">
                            <NavLinks />
                            <div className="flex items-center">
                                <GoogleLogin
                                    onSuccess={handleSuccess}
                                    onError={handleError}
                                    useOneTap
                                />
                            </div>
                        </div>

                        <button
                            className="md:hidden p-2"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>

                    {isMenuOpen && (
                        <div className="md:hidden py-4 border-t border-gray-100">
                            <div className="flex flex-col gap-4">
                                <MobileNavLinks />
                                <div className="flex justify-center pt-4 border-t border-gray-100">
                                    <GoogleLogin
                                        onSuccess={handleSuccess}
                                        onError={handleError}
                                        useOneTap
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </nav>
            </header>

            {/* Main Content with Header Offset */}
            <div className="pt-16">
                {/* Hero Section */}
                <div className="container mx-auto px-4 pt-20 pb-32 relative">
                    <div className="max-w-5xl mx-auto">
                        <div className="text-center mb-16">
                            <div className="inline-flex items-center gap-3 bg-teal-100 text-teal-800 px-4 py-2 rounded-full mb-6 animate-bounce">
                                <Plane className="animate-pulse" size={20} />
                                <span>Your AI Travel Companion</span>
                            </div>
                            <h1 className="text-6xl font-bold text-gray-900 mb-6">
                                Transform Your Travel Dreams Into
                                <span className="block mt-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-transparent bg-clip-text">
                                    Perfect Itineraries
                                </span>
                            </h1>
                            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                                Stop spending hours planning. Our AI creates personalized day-by-day travel plans that match your style, budget, and dreams.
                            </p>
                            <div className="flex gap-6 justify-center">
                                <button className="group bg-teal-600 text-white px-8 py-4 rounded-xl font-medium inline-flex items-center gap-2 hover:bg-teal-700 transition-all hover:-translate-y-1 hover:shadow-lg">
                                    Start Planning
                                    <ArrowRight className="transition-transform group-hover:translate-x-1" size={20} />
                                </button>
                                <button className="relative overflow-hidden bg-white text-teal-600 px-8 py-4 rounded-xl font-medium border-2 border-teal-200 hover:border-teal-600 transition-colors group">
                                    <span className="relative z-10 group-hover:text-white transition-colors">Watch How It Works</span>
                                    <div className="absolute inset-0 bg-teal-600 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Features Section */}
                <div className="bg-white py-24" id="features">
                    <div className="container mx-auto px-4">
                        <h2 className="text-4xl font-bold text-center mb-4">How We Make Travel Planning Effortless</h2>
                        <p className="text-gray-600 text-center mb-16 max-w-2xl mx-auto">
                            From spontaneous weekend getaways to month-long adventures, we handle all the details so you can focus on the excitement.
                        </p>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                            {features.map((feature, index) => (
                                <FeatureCard
                                    key={index}
                                    {...feature}
                                    isActive={activeFeature === index}
                                    onMouseEnter={() => setActiveFeature(index)}
                                    onMouseLeave={() => setActiveFeature(null)}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Process Section */}
                <div className="bg-teal-50 py-24" id="how-it-works">
                    <div className="container mx-auto px-4">
                        <div className="max-w-3xl mx-auto">
                            <h2 className="text-4xl font-bold text-center mb-16">Four Simple Steps to Your Perfect Trip</h2>
                            <div className="space-y-12">
                                {steps.map((step, index) => (
                                    <div key={index} className="flex items-start gap-6">
                                        <div className="bg-teal-100 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <span className="text-teal-600 text-xl font-bold">{index + 1}</span>
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-semibold mb-2">{step.title}</h3>
                                            <p className="text-gray-600 text-lg">{step.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* CTA Section */}
                <div className="py-24 relative overflow-hidden">
                    <div className="container mx-auto px-4">
                        <div className="max-w-4xl mx-auto text-center">
                            <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Travel Planning?</h2>
                            <p className="text-xl text-gray-600 mb-8">
                                Join thousands of happy travelers who plan better trips in minutes, not hours.
                            </p>
                            <button className="group bg-teal-600 text-white px-8 py-4 rounded-xl font-medium inline-flex items-center gap-2 hover:bg-teal-700 transition-all hover:-translate-y-1 hover:shadow-xl">
                                Create Your First Trip
                                <Globe className="transition-transform group-hover:rotate-180" size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Contact Section */}
                <div className="bg-teal-50 py-24" id="contact">
                    <div className="container mx-auto px-4">
                        <ContactForm />
                    </div>
                </div>
            </div>
        </div>
    );
};

const NavLinks = () => (
    <div className="flex items-center gap-6">
        {[
            { text: "Features", href: "#features" },
            { text: "How It Works", href: "#how-it-works" },
            { text: "Contact", href: "#contact" }
        ].map((link) => (
            <a
                key={link.text}
                href={link.href}
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
                {link.text}
            </a>
        ))}
    </div>
);

const MobileNavLinks = () => (
    <div className="flex flex-col gap-4">
        {[
            { text: "Features", href: "#features" },
            { text: "How It Works", href: "#how-it-works" },
            { text: "Contact", href: "#contact" }
        ].map((link) => (
            <a
                key={link.text}
                href={link.href}
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
                {link.text}
            </a>
        ))}
    </div>
);

const features = [
    {
        icon: <MessageSquare size={32} />,
        title: "Chat Like a Friend",
        description: "Simply tell us what you love - from food adventures to historical sites. Our AI understands and adapts to your style.",
    },
    {
        icon: <Calendar size={32} />,
        title: "Smart Scheduling",
        description: "We consider opening hours, travel time, and local events to create the perfect daily flow.",
    },
    {
        icon: <Map size={32} />,
        title: "Local Expert Insights",
        description: "Discover hidden gems and local favorites that match your interests, not just tourist hotspots.",
    },
    {
        icon: <Clock size={32} />,
        title: "Real-Time Adaptation",
        description: "Plans adjust to weather changes, sudden closures, or your spontaneous decisions.",
    },
    {
        icon: <Settings size={32} />,
        title: "Endless Customization",
        description: "Tweak any detail until it's perfect. Our AI learns from your preferences for future trips.",
    },
    {
        icon: <Camera size={32} />,
        title: "Shareable Memories",
        description: "Export your plan to Google Maps, share with friends, or keep it as a beautiful travel journal.",
    }
];

const steps = [
    {
        title: "Create Your Account",
        description: "Quick signup with Google or email. No credit card required to start planning."
    },
    {
        title: "Tell Us Your Dreams",
        description: "Chat naturally about where you want to go and what you love to do while traveling."
    },
    {
        title: "Review Your Custom Plan",
        description: "Get a detailed itinerary with daily activities, estimated costs, and local tips."
    },
    {
        title: "Refine & Explore",
        description: "Easily modify any detail or generate new suggestions until it's perfect."
    }
];

const FeatureCard = ({ icon, title, description, isActive, onMouseEnter, onMouseLeave }) => {
    return (
        <div
            className={`p-8 rounded-2xl transition-all duration-500 transform ${isActive
                    ? 'bg-teal-600 text-white -translate-y-2 shadow-xl'
                    : 'bg-white hover:shadow-lg'
                }`}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <div className={`transition-colors duration-500 ${isActive ? 'text-white' : 'text-teal-600'}`}>
                {icon}
            </div>
            <h3 className="text-xl font-semibold mt-4 mb-2">{title}</h3>
            <p className={`transition-colors duration-500 ${isActive ? 'text-teal-50' : 'text-gray-600'}`}>
                {description}
            </p>
        </div>
    );
};

const ProcessStep = ({ number, title, description }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            className="group relative pl-16"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className={`absolute left-0 top-0 w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl transition-all duration-500 ${isHovered
                    ? 'bg-teal-600 text-white rotate-12 shadow-lg'
                    : 'bg-teal-100 text-teal-600'
                }`}>
                {number}
            </div>
            <h3 className="text-xl font-semibold mb-2">{title}</h3>
            <p className="text-gray-600">{description}</p>
        </div>
    );
};

export default LandingPage;