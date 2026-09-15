import React, { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { BiCameraMovie, BiSolidCameraMovie } from 'react-icons/bi'
import { IoHomeSharp } from 'react-icons/io5'
import { MdOutlinePlaylistAdd } from 'react-icons/md'
import { RiDraftFill } from 'react-icons/ri'
import { FaUser, FaTimes } from 'react-icons/fa'
import { PiSignInBold } from 'react-icons/pi'

function Aside({ open, onClose }) {
  const router = useRouter()

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' && open) onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  const isActive = (path) => router.pathname === path

  return (
    <div className={`aside ${open ? 'aside--open' : ''}`}>
      <div className="aside__top">
        <div className="logo flex">
          <BiCameraMovie />
          <Link href="/">
            <h1>MakMovie</h1>
          </Link>
        </div>
        <button
          className="aside__close"
          onClick={onClose}
          aria-label="Close sidebar"
        >
          <FaTimes />
        </button>
      </div>
      <ul className="mt-2">
        <Link
          href="/"
          className={isActive('/') ? 'active' : ''}
          onClick={onClose}
        >
          <li>
            <div>
              <IoHomeSharp />
            </div>
            Dashboard
          </li>
        </Link>
        <Link
          href="/movies"
          className={isActive('/movies') ? 'active' : ''}
          onClick={onClose}
        >
          <li>
            <div>
              <BiSolidCameraMovie />
            </div>
            Movies
          </li>
        </Link>
        <Link
          href="/addmovie"
          className={isActive('/addmovie') ? 'active' : ''}
          onClick={onClose}
        >
          <li>
            <div>
              <MdOutlinePlaylistAdd />
            </div>
            Add Movie
          </li>
        </Link>
        <Link
          href="/draft"
          className={isActive('/draft') ? 'active' : ''}
          onClick={onClose}
        >
          <li>
            <div>
              <RiDraftFill />
            </div>
            Draft
          </li>
        </Link>
      </ul>
      <h3 className="mt-2">Account Pages</h3>
      <ul className="mt-2">
        <Link
          href="/profile"
          className={isActive('/profile') ? 'active' : ''}
          onClick={onClose}
        >
          <li>
            <div>
              <FaUser />
            </div>
            Profile
          </li>
        </Link>
        <Link
          href="/auth"
          className={isActive('/auth') ? 'active' : ''}
          onClick={onClose}
        >
          <li>
            <div>
              <PiSignInBold />
            </div>
            Sign In
          </li>
        </Link>
      </ul>
    </div>
  )
}

export default Aside