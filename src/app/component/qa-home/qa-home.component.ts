import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-qa-home',
  imports: [CommonModule],
  templateUrl: './qa-home.component.html',
  styleUrl: './qa-home.component.scss'
})
export class QaHomeComponent {

  technologies = [
    {
      category: 'Java',
      slug: 'java',
      items: [
        { name: 'Core Java', count: 250, icon: 'assets/images/java.png' },
        { name: 'Spring Boot', count: 120, icon: 'assets/images/springboot.png' },
        { name: 'Hibernate', count: 90, icon: 'assets/images/hibernate.png' },
        { name: 'JPA', count: 60, icon: 'assets/images/jpa.png' },
        { name: 'JUnit', count: 50, icon: 'assets/images/junit.png' },
        { name: 'Microservices', count: 30, icon: 'assets/images/microservices.png' },
        { name: 'RESTful APIs', count: 10, icon: 'assets/images/restful.png' },
      ]
    },
    {
      category: 'JavaScript',
      slug: 'javascript',
      items: [
        { name: 'JavaScript', count: 200, icon: 'assets/images/js.png' },
        { name: 'Angular', count: 180, icon: 'assets/images/angular.png' },
        { name: 'React', count: 160, icon: 'assets/images/react.png' },
        { name: 'Vue.js', count: 70, icon: 'assets/images/vuejs.png' },
        { name: 'Node.js', count: 140, icon: 'assets/images/nodejs.png' },
        { name: 'TypeScript', count: 170, icon: 'assets/images/ts.png' },
      ]
    },
    {
      category: 'Python',
      slug: 'python',
      items: [
        { name: 'Python', count: 150, icon: 'assets/images/python.png' },
        { name: 'Django', count: 110, icon: 'assets/images/django.png' },
        { name: 'Flask', count: 80, icon: 'assets/images/flask.png' },
        { name: 'Machine Learning', count: 100, icon: 'assets/images/ml.png' },
        { name: 'Data Science', count: 90, icon: 'assets/images/ds.png' },
        { name: 'AI', count: 50, icon: 'assets/images/ai.png' },
        { name: 'Big Data', count: 40, icon: 'assets/images/bigdata.png' },
      ]
    },
    {
      category: 'C#/.NET',
      slug: 'csharp-dotnet',
      items: [
        { name: 'C#', count: 100, icon: 'assets/images/cSharp.png' },
        { name: '.NET', count: 90, icon: 'assets/images/dotnet.png' },
        { name: 'ASP.NET', count: 80, icon: 'assets/images/aspnet.png' },
        { name: 'Entity Framework', count: 70, icon: 'assets/images/entityframework.png' },
      ],
    },
    {
      category: 'php',
      slug: 'php',
      items: [
        { name: 'PHP', count: 130, icon: 'assets/images/php.png' },
        { name: 'Laravel', count: 50, icon: 'assets/images/laravel.png' },
        { name: 'Symfony', count: 40, icon: 'assets/images/symfony.png' },
        { name: 'CodeIgniter', count: 30, icon: 'assets/images/codeigniter.png' },
        { name: 'WordPress', count: 20, icon: 'assets/images/wordpress.png' },
        { name: 'Drupal', count: 10, icon: 'assets/images/drupal.png' },
        { name: 'Joomla', count: 5, icon: 'assets/images/joomla.png' },
        { name: 'Magento', count: 15, icon: 'assets/images/magento.png' },
        { name: 'CakePHP', count: 8, icon: 'assets/images/cakephp.png' },
        { name: 'Zend Framework', count: 12, icon: 'assets/images/zend.png' },
        { name: 'PHPUnit', count: 18, icon: 'assets/images/phpunit.png' },
        { name: 'Composer', count: 22, icon: 'assets/images/composer.png' },
        { name: 'Twig', count: 14, icon: 'assets/images/twig.png' },
      ]
    },
    {
      category: 'Ruby',
      slug: 'ruby',
      items: [
        { name: 'Ruby on Rails', count: 60, icon: 'assets/images/rails.png' },
        { name: 'RSpec', count: 30, icon: 'assets/images/rspec.png' },
      ]
    },
    {
      category: 'Mobile Development',
      slug: 'mobile-development',
      items: [
        { name: 'iOS Development', count: 70, icon: 'assets/images/ios.png' },
        { name: 'Android Development', count: 80, icon: 'assets/images/android.png' },
        { name: 'React Native', count: 50, icon: 'assets/images/reactnative.png' },
        { name: 'Flutter', count: 40, icon: 'assets/images/flutter.png' },
        { name: 'Xamarin', count: 30, icon: 'assets/images/xamarin.png' },
      ]
    },
    {
      category: 'C++',
      slug: 'cplus',
      items: [
        { name: 'C++', count: 100, icon: 'assets/images/cpp.png' },
        { name: 'STL', count: 80, icon: 'assets/images/stl.png' },
        { name: 'Boost', count: 60, icon: 'assets/images/boost.png' },
        { name: 'Qt', count: 40, icon: 'assets/images/qt.png' },
      ],
    },
    {
      category: 'Swift',
      slug: 'swift',
      items: [
        { name: 'iOS Development', count: 70, icon: 'assets/images/ios.png' },
        { name: 'SwiftUI', count: 40, icon: 'assets/images/swiftui.png' },
        { name: 'Xcode', count: 30, icon: 'assets/images/xcode.png' },

      ],
    },
    {
      category: 'Kotlin',
      slug: 'kotlin',
      items: [
        { name: 'Android Development', count: 80, icon: 'assets/images/android.png' },
        { name: 'Kotlin', count: 50, icon: 'assets/images/kotlin.png' },
        { name: 'Jetpack Compose', count: 30, icon: 'assets/images/jetpack.png' },
        { name: 'Gradle', count: 20, icon: 'assets/images/gradle.png' },
        { name: 'Android Studio', count: 10, icon: 'assets/images/android.png' },
        { name: 'Coroutines', count: 15, icon: 'assets/images/coroutines.png' },
        { name: 'Dagger', count: 5, icon: 'assets/images/dagger.png' },
      ],
    },
    {
      category: 'SQL',
      slug: 'sql',
      items: [
        { name: 'SQL', count: 190, icon: 'assets/images/sql.png' },
        { name: 'NoSQL', count: 160, icon: 'assets/images/nosql.png' },
        { name: 'Database Design', count: 70, icon: 'assets/images/database.png' },
        { name: 'Data Modeling', count: 60, icon: 'assets/images/datamodeling.png' },
        { name: 'ETL', count: 50, icon: 'assets/images/etl.png' },
        { name: 'Data Warehousing', count: 40, icon: 'assets/images/datawarehousing.png' },
        { name: 'SQL Server', count: 30, icon: 'assets/images/sqlserver.png' },
        { name: 'PostgreSQL', count: 20, icon: 'assets/images/postgresql.png' },
        { name: 'MySQL', count: 10, icon: 'assets/images/mysql.png' },
        { name: 'Oracle DB', count: 15, icon: 'assets/images/oracledb.png' },
        { name: 'MongoDB', count: 25, icon: 'assets/images/mongodb.png' },
      ],
    },
    {
      category: 'HTML/CSS',
      slug: 'html-css',
      items: [
        { name: 'HTML', count: 100, icon: 'assets/images/html.png' },
        { name: 'CSS', count: 90, icon: 'assets/images/css.png' },
        { name: 'JavaScript', count: 80, icon: 'assets/images/js.png' },
        { name: 'Bootstrap', count: 70, icon: 'assets/images/bootstrap.png' },
        { name: 'Tailwind CSS', count: 60, icon: 'assets/images/tailwindcss.png' },
        { name: 'Sass', count: 50, icon: 'assets/images/sass.png' },
        { name: 'Less', count: 40, icon: 'assets/images/less.png' },
      ]
    },
    {
      category: 'Testing',
      slug: 'testing',
      items: [
        { name: 'Selenium', count: 90, icon: 'assets/images/selenium.png' },
        { name: 'Cucumber', count: 80, icon: 'assets/images/cucumber.png' },
        { name: 'jasmine', count: 75, icon: 'assets/images/jasmine.png' },
        { name: 'Protractor', count: 65, icon: 'assets/images/protractor.png' },
        { name: 'karma', count: 55, icon: 'assets/images/karma.png' },
        { name: 'Cypress', count: 70, icon: 'assets/images/cypress.png' },
        { name: 'Jest', count: 60, icon: 'assets/images/jest.png' },
        { name: 'Mocha', count: 50, icon: 'assets/images/mocha.png' },
        { name: 'Chai', count: 40, icon: 'assets/images/chai.png' },
        { name: 'JUnit', count: 80, icon: 'assets/images/junit.png' },
        { name: 'TestNG', count: 30, icon: 'assets/images/testng.png' },
        { name: 'PyTest', count: 20, icon: 'assets/images/pytest.png' },
      ]
    },
    {
      category: 'Go',
      slug: 'go',
      items: [
        { name: 'Go', count: 20, icon: 'assets/images/go.png' },
        { name: 'Rust', count: 10, icon: 'assets/images/rust.png' },
        { name: 'Docker', count: 150, icon: 'assets/images/docker.png' },
        { name: 'Kubernetes', count: 140, icon: 'assets/images/kubernetes.png' },
        { name: 'AWS', count: 130, icon: 'assets/images/aws.png' },
        { name: 'Azure', count: 120, icon: 'assets/images/azure.png' },
        { name: 'GCP', count: 110, icon: 'assets/images/gcp.png' },
        { name: 'DevOps', count: 80, icon: 'assets/images/devops.png' },
        { name: 'Cybersecurity', count: 70, icon: 'assets/images/cybersecurity.png' },
        { name: 'Blockchain', count: 60, icon: 'assets/images/blockchain.png' },
      ]
    }
  ];

  popularQuestions = [
    {
      question: 'What is JVM?',
      shortAnswer: 'JVM is a virtual machine that enables Java bytecode execution...'
    },
    {
      question: 'What is Dependency Injection?',
      shortAnswer: 'DI is a design pattern used to implement IoC...'
    }
  ];
}
