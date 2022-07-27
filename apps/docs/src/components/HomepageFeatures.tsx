import React from 'react';
import clsx from 'clsx';
import styles from './HomepageFeatures.module.css';

type FeatureItem = {
  title: string;
  image: string;
  description: JSX.Element;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Easy to Use',
    image: '/img/easy.svg',
    description: (
      <>
        Very simple API. It is also extensible so you can easily write framework
        specific wrappers. Add authentication to your client app in a matter of
        minutes.
      </>
    ),
  },
  {
    title: 'Secure',
    image: '/img/secure.svg',
    description: <>Implemented following the OpenID Connect protocol.</>,
  },
  {
    title: 'Typescript',
    image: '/img/ts-logo-256.svg',
    description: (
      <>
        Use it in any frontend framework which relies on Typescript or
        Javascript.
      </>
    ),
  },
];

function Feature({ title, image, description }: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <img className={styles.featureSvg} alt={title} src={image} />
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
