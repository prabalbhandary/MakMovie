import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { FaArrowLeft, FaDownload, FaStar } from "react-icons/fa";
import { useEffect, useMemo, useState } from "react";
import useFetchData from "@/hooks/useFetchData";
import Loader from "@/components/Loader";
import VideoPlayer from "@/components/VideoPlayer";
import { getVideoSources, resolveSources } from "@/lib/videoSource";

function WatchPlayer({ movie }) {
  const rawSources = useMemo(() => getVideoSources(movie), [movie]);
  const [sources, setSources] = useState([]);

  useEffect(() => {
    if (!rawSources.length) return;
    let active = true;
    resolveSources(rawSources).then((resolved) => {
      if (active) setSources(resolved);
    });
    return () => {
      active = false;
    };
  }, [rawSources]);

  if (!rawSources.length) {
    return (
      <VideoPlayer
        title={movie?.title}
        poster={movie?.bgposter}
        sources={[]}
        fallbackLink={movie?.watchonline}
      />
    );
  }

  if (!sources.length) {
    return (
      <div className="mkplayer mkplayer__empty">
        <div>
          <h3>Preparing player...</h3>
          <p>Checking your stream links to pick the best playback mode.</p>
        </div>
      </div>
    );
  }

  return (
    <VideoPlayer
      title={movie?.title}
      poster={movie?.bgposter}
      sources={sources}
      fallbackLink={movie?.watchonline}
    />
  );
}

export default function WatchPage() {
  const router = useRouter();
  const { slug } = router.query;
  const { alldata, loading } = useFetchData(`/api/getmovies?slug=${slug}`);
  const movie = alldata && alldata[0];

  return (
    <>
      <Head>
        <title>{movie ? movie.title : slug}</title>
      </Head>
      <div className="watchcontainer">
        {loading ? (
          <Loader />
        ) : movie ? (
          <>
            <div className="watchback">
              <Link href={`/movies/${movie?.slug}`}>
                <FaArrowLeft /> Back to {movie?.titlecategory || "Movie"}
              </Link>
            </div>

            <div className="watchplayer">
              <WatchPlayer key={movie.slug} movie={movie} />
            </div>

            <div className="watchinfo">
              <h1>{movie?.title}</h1>
              <div className="watchmeta">
                <span>{movie?.year}</span>
                <span>{movie?.duration}</span>
                <span>{movie?.quality}</span>
                {movie?.genre?.length ? (
                  <span>{movie.genre.join(", ").toUpperCase()}</span>
                ) : null}
                <span className="watchrate">
                  <FaStar /> {movie?.rating}
                </span>
              </div>
              <p>{movie?.description}</p>
            </div>

            {movie?.downloadlink ? (
              <section className="watchdownloads">
                <h3>Download Links</h3>
                <div className="watchdownloadlinks">
                  {movie.downloadlink["480p"] ? (
                    <a target="_blank" rel="noreferrer" href={movie.downloadlink["480p"]}>
                      Download 480p
                    </a>
                  ) : null}
                  {movie.downloadlink["720p"] ? (
                    <a target="_blank" rel="noreferrer" href={movie.downloadlink["720p"]}>
                      Download 720p
                    </a>
                  ) : null}
                  {movie.downloadlink["1080p"] ? (
                    <a target="_blank" rel="noreferrer" href={movie.downloadlink["1080p"]}>
                      Download 1080p
                    </a>
                  ) : null}
                  {movie.downloadlink["4k"] ? (
                    <a target="_blank" rel="noreferrer" href={movie.downloadlink["4k"]}>
                      Download 4k
                    </a>
                  ) : null}
                  {!movie.downloadlink["480p"] &&
                  !movie.downloadlink["720p"] &&
                  !movie.downloadlink["1080p"] &&
                  !movie.downloadlink["4k"] ? (
                    <p className="watchnodl">No download links available.</p>
                  ) : null}
                </div>
              </section>
            ) : null}

            <div className="watchmoreactions">
              <Link href={`/movies/${movie?.slug}`}>
                <div className="watchcard">
                  <FaDownload />
                  <span>Detail & Download</span>
                </div>
              </Link>
            </div>
          </>
        ) : (
          <div className="watchback">
            <p className="watchnodl">Movie not found.</p>
          </div>
        )}
      </div>
    </>
  );
}