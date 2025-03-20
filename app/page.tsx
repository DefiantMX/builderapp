import Link from "next/link"
import VikingLogo from "./components/VikingLogo"
import { getServerSession } from "next-auth/next"
import { authOptions } from "./api/auth/[...nextauth]/route"

export default async function Home() {
  const session = await getServerSession(authOptions)

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-theme(spacing.32))] -mt-8 bg-white">
      <div className="text-center mb-8">
        <VikingLogo size={250} className="mb-6" />
        <h1 className="text-5xl font-bold mb-4 text-gray-900 font-serif">VALHALLA BUILDER</h1>
        <p className="text-gray-600 max-w-md mx-auto mb-8">
          The ultimate construction management platform for modern warriors of the building industry
        </p>
      </div>

      <nav className="flex flex-wrap justify-center gap-4">
        <Link
          href="/projects"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition duration-300 shadow-lg hover:shadow-xl"
        >
          Projects
        </Link>
        <Link
          href="/tasks"
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition duration-300 shadow-lg hover:shadow-xl"
        >
          Tasks
        </Link>
        <Link
          href="/messages"
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg transition duration-300 shadow-lg hover:shadow-xl"
        >
          Messages
        </Link>
        <Link
          href="/finances"
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg transition duration-300 shadow-lg hover:shadow-xl"
        >
          Finances
        </Link>
      </nav>

      {!session && (
        <div className="mt-12 text-center">
          <h2 className="text-2xl font-bold mb-4">Join Valhalla Builder</h2>
          <p className="text-gray-600 mb-6">
            Sign up now to start managing your construction projects like a pro.
          </p>
          <Link
            href="/register"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition duration-300 shadow-lg hover:shadow-xl"
          >
            Get Started
          </Link>
        </div>
      )}
    </div>
  )
}

