import React, {useState, useEffect} from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import {BiCameraMovie, BiSolidCameraMovie} from 'react-icons/bi'
import {IoHomeSharp} from 'react-icons/io5'
import {MdOutlinePlaylistAdd} from 'react-icons/md'
import {RiDraftFill} from 'react-icons/ri'
import {FaUser} from 'react-icons/fa'
import {PiSignInBold} from 'react-icons/pi'

function Aside() {
  const router = useRouter()
  const [clicked, setClicked] = useState(false)
  const [activeLink, setActiveLink] = useState('/')
  const handleClick = () => {
    setClicked(!clicked)
  }
  const handleLinkClick = (link) => {
    setActiveLink(link)
    setClicked(false)
  }
  useEffect(() => {
    setActiveLink(router.pathname)
  }, [router.pathname])
  return (
    <div className='aside'>
      <div className='logo flex'>
        <BiCameraMovie />
        <Link href='/'>
          <h1>MakMovie</h1>
        </Link>
      </div>
      <ul className='mt-2'>
        <Link href='/' className={activeLink === '/' ? 'active' : ''} onClick={() => handleLinkClick('/')}>
          <li>
            <div>
              <IoHomeSharp />
            </div>
            Dashboard
          </li>
        </Link>
        <Link href='/movies' className={activeLink === '/movies' ? 'active' : ''} onClick={() => handleLinkClick('/movies')}>
          <li>
            <div>
              <BiSolidCameraMovie />
            </div>
            Movies
          </li>
        </Link>
        <Link href='/addmovie' className={activeLink === '/addmovie' ? 'active' : ''} onClick={() => handleLinkClick('/addmovie')}>
          <li>
            <div>
              <MdOutlinePlaylistAdd />
            </div>
            Add Movie
          </li>
        </Link>
        <Link href='/draft' className={activeLink === '/draft' ? 'active' : ''} onClick={() => handleLinkClick('/draft')}>
          <li>
            <div>
              <RiDraftFill />
            </div>
            Draft
          </li>
        </Link>
      </ul>
      <h3 className='mt-2'>Account Pages</h3>
      <ul className='mt-2'>
        <Link href='/profile' className={activeLink === '/profile' ? 'active' : ''} onClick={() => handleLinkClick('/profile')}>
          <li>
            <div>
              <FaUser />
            </div>
            Profile
          </li>
        </Link>
        <Link href='/auth' className={activeLink === '/auth' ? 'active' : ''} onClick={() => handleLinkClick('/auth')}>
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